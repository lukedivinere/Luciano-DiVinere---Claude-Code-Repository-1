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
