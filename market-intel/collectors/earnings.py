"""Earnings calendar collector (Finnhub) — fills report section 3.

Uses Finnhub's documented, stable earnings-calendar endpoint:
    GET https://finnhub.io/api/v1/calendar/earnings?from=&to=&token=
    -> {"earningsCalendar": [ {symbol, date, hour, epsActual, epsEstimate,
                               revenueActual, revenueEstimate, quarter, year}, ...]}

Design:
  - The HTTP fetch is injectable, so parsing/summarizing is unit-tested
    offline against sample payloads shaped like Finnhub's real response.
  - Requires a free FINNHUB_API_KEY; without one this collector no-ops
    (returns empty) rather than failing the run.
  - Parsing is defensive: missing / null actuals (upcoming reports) are
    handled, never assumed present.

Reports beats/misses vs. estimates. Makes no recommendation.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Callable, Optional

import config

FINNHUB_URL = "https://finnhub.io/api/v1/calendar/earnings"


def _surprise_pct(actual, estimate) -> Optional[float]:
    """Percent surprise vs. estimate, or None if not computable."""
    if actual is None or estimate in (None, 0):
        return None
    try:
        return round((actual - estimate) / abs(estimate) * 100, 1)
    except (TypeError, ZeroDivisionError):
        return None


def _hour_label(hour: str) -> str:
    return {"bmo": "before open", "amc": "after close", "dmh": "during market"}.get(
        (hour or "").lower(), hour or ""
    )


def normalize_record(raw: dict) -> dict:
    """Turn one Finnhub calendar row into our normalized earnings record."""
    eps_a = raw.get("epsActual")
    eps_e = raw.get("epsEstimate")
    rev_a = raw.get("revenueActual")
    rev_e = raw.get("revenueEstimate")

    if eps_a is None:
        status = "upcoming"
    elif eps_e is None:
        status = "reported"
    elif eps_a > eps_e:
        status = "beat"
    elif eps_a < eps_e:
        status = "miss"
    else:
        status = "inline"

    return {
        "symbol": (raw.get("symbol") or "").upper(),
        "date": raw.get("date", ""),
        "hour": _hour_label(raw.get("hour", "")),
        "status": status,
        "eps_actual": eps_a,
        "eps_estimate": eps_e,
        "eps_surprise_pct": _surprise_pct(eps_a, eps_e),
        "rev_actual": rev_a,
        "rev_estimate": rev_e,
        "rev_surprise_pct": _surprise_pct(rev_a, rev_e),
    }


def parse_calendar(payload: dict, symbols) -> dict:
    """Filter a Finnhub payload to our symbols; keep the latest row per symbol."""
    wanted = {s.upper() for s in symbols}
    by_symbol: dict[str, dict] = {}
    for raw in (payload or {}).get("earningsCalendar", []) or []:
        rec = normalize_record(raw)
        if rec["symbol"] not in wanted:
            continue
        prev = by_symbol.get(rec["symbol"])
        # Keep the most recent date for each symbol.
        if prev is None or rec["date"] >= prev["date"]:
            by_symbol[rec["symbol"]] = rec
    return by_symbol


def _default_fetch(url: str) -> dict:
    import requests

    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    return resp.json()


def get_earnings(symbols: Optional[list[str]] = None, *,
                 days_back: int = 3, days_ahead: int = 7,
                 api_key: Optional[str] = None,
                 fetch: Optional[Callable[[str], dict]] = None,
                 today: Optional[date] = None) -> dict:
    """Fetch earnings for our symbols in a recent+upcoming window.

    Returns {"by_symbol": {...}, "error": None|str}. No key -> empty, no error
    raised (the section simply shows nothing).
    """
    symbols = symbols or config.TICKERS
    api_key = api_key if api_key is not None else getattr(config, "FINNHUB_API_KEY", "")
    if not api_key:
        return {"by_symbol": {}, "error": None}

    today = today or date.today()
    frm = (today - timedelta(days=days_back)).isoformat()
    to = (today + timedelta(days=days_ahead)).isoformat()
    url = f"{FINNHUB_URL}?from={frm}&to={to}&token={api_key}"

    fetch = fetch or _default_fetch
    try:
        payload = fetch(url)
    except Exception as exc:  # noqa: BLE001 - collector must be resilient
        return {"by_symbol": {}, "error": str(exc)}

    return {"by_symbol": parse_calendar(payload, symbols), "error": None}


# --- Recent reported earnings (Yahoo, no API key) --------------------------
# Finnhub's calendar needs a key and a narrow date window. To show each stock's
# MOST RECENT reported quarter on its card with zero configuration, we pull
# per-symbol earnings history from Yahoo (via yfinance, same source the price
# collector already uses). ETFs have no earnings, so they simply return nothing.


def _num(v):
    """Coerce to float, treating None / non-numeric / NaN as None."""
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return None if f != f else f  # f != f is True only for NaN


def _record_from_row(symbol: str, row: dict) -> dict:
    """Build our normalized record from one reported Yahoo earnings row."""
    eps_a = _num(row.get("eps_actual"))
    eps_e = _num(row.get("eps_estimate"))
    surprise = _num(row.get("surprise_pct"))
    if surprise is None:
        surprise = _surprise_pct(eps_a, eps_e)

    if eps_a is None:
        status = "upcoming"
    elif eps_e is None:
        status = "reported"
    elif eps_a > eps_e:
        status = "beat"
    elif eps_a < eps_e:
        status = "miss"
    else:
        status = "inline"

    return {
        "symbol": symbol.upper(),
        "date": row.get("date", ""),
        "hour": "",
        "status": status,
        "eps_actual": eps_a,
        "eps_estimate": eps_e,
        "eps_surprise_pct": surprise,
        "rev_actual": None,
        "rev_estimate": None,
        "rev_surprise_pct": None,
    }


def _latest_reported(symbol: str, rows: list, today: date) -> Optional[dict]:
    """Pick the most recent row that has actuals and a date on/before today."""
    reported = [
        r for r in (rows or [])
        if _num(r.get("eps_actual")) is not None and (r.get("date") or "") <= today.isoformat()
    ]
    if not reported:
        return None
    best = max(reported, key=lambda r: r.get("date", ""))
    return _record_from_row(symbol, best)


def _default_recent_fetch(symbol: str) -> list:
    """Per-symbol earnings history from Yahoo via yfinance (no key)."""
    import yfinance as yf

    df = yf.Ticker(symbol).get_earnings_dates(limit=12)
    if df is None or getattr(df, "empty", True):
        return []
    rows = []
    for idx, r in df.iterrows():
        try:
            d = idx.date().isoformat()
        except AttributeError:
            d = str(idx)[:10]
        rows.append({
            "date": d,
            "eps_estimate": r.get("EPS Estimate"),
            "eps_actual": r.get("Reported EPS"),
            "surprise_pct": r.get("Surprise(%)"),
        })
    return rows


def get_recent_earnings(symbols: Optional[list[str]] = None, *,
                        fetch: Optional[Callable[[str], list]] = None,
                        today: Optional[date] = None) -> dict:
    """Most recent reported earnings per symbol (Yahoo). No key required.

    Returns {"by_symbol": {...}, "error": None|str}. Symbols with no earnings
    (ETFs, or fetch failures) are simply omitted — never fatal.
    """
    symbols = symbols or config.TICKERS
    today = today or date.today()
    fetch = fetch or _default_recent_fetch
    by_symbol: dict[str, dict] = {}
    last_error = None
    for sym in symbols:
        try:
            rows = fetch(sym)
        except Exception as exc:  # noqa: BLE001 - one bad symbol never fails the run
            last_error = str(exc)
            continue
        rec = _latest_reported(sym, rows, today)
        if rec:
            by_symbol[sym.upper()] = rec
    return {"by_symbol": by_symbol, "error": last_error}
