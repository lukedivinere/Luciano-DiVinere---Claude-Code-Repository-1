"""Market-implied expected next-session move (NOT a forecast or advice).

Answers "where does the market assume it could go next session?" the only
objective way: a probability band, not a direction.

Two sources, best first:
  1. OPTIONS-IMPLIED — from the nearest option expiry's at-the-money implied
     volatility (what the options market is actually pricing). Scaled to one
     trading session: move ≈ price × IV / sqrt(252).
  2. RECENT-VOLATILITY fallback — when a name has no options, one standard
     deviation of its recent daily returns (a typical 1-day move).

Either way the output is a ±range (low/high), explicitly a volatility band
— never a prediction of direction and never a recommendation. The HTTP/data
access is injectable so the math is unit-tested offline.
"""

from __future__ import annotations

import math
from datetime import date
from typing import Callable, Optional

TRADING_DAYS = 252


def pick_atm_iv(calls: list, puts: list, price: float) -> Optional[float]:
    """Average of the at-the-money call & put implied vols (as a fraction).

    `calls`/`puts` are lists of dicts with 'strike' and 'impliedVolatility'.
    ATM = the contract whose strike is nearest the current price.
    """
    if not price or price <= 0:
        return None

    def _atm_iv(rows):
        best_iv = None
        best_dist = None
        for r in rows or []:
            try:
                strike = float(r.get("strike"))
                iv = float(r.get("impliedVolatility"))
            except (TypeError, ValueError):
                continue
            if iv != iv or iv <= 0:   # skip NaN / non-positive
                continue
            dist = abs(strike - price)
            if best_dist is None or dist < best_dist:
                best_dist, best_iv = dist, iv
        return best_iv

    civ = _atm_iv(calls)
    piv = _atm_iv(puts)
    ivs = [v for v in (civ, piv) if v is not None]
    if not ivs:
        return None
    return sum(ivs) / len(ivs)


def implied_daily_move(price: float, iv_annual: float) -> Optional[float]:
    """One-session expected move (absolute $) from annualized implied vol."""
    if not price or price <= 0 or not iv_annual or iv_annual <= 0:
        return None
    return price * iv_annual / math.sqrt(TRADING_DAYS)


def daily_vol_from_prices(prices: list) -> Optional[float]:
    """Std dev of recent daily simple returns, or None if too little data."""
    clean = [float(p) for p in (prices or []) if p not in (None, 0)]
    if len(clean) < 6:
        return None
    rets = [(clean[i] / clean[i - 1]) - 1.0 for i in range(1, len(clean))
            if clean[i - 1]]
    if len(rets) < 5:
        return None
    mean = sum(rets) / len(rets)
    var = sum((r - mean) ** 2 for r in rets) / (len(rets) - 1)
    return math.sqrt(var)


def _band(price: float, move_abs: float, source: str,
          iv: Optional[float] = None, expiry: Optional[str] = None) -> dict:
    return {
        "source": source,                      # "options" | "historical"
        "price": price,
        "move_abs": round(move_abs, 2),
        "move_pct": round(move_abs / price * 100, 1),
        "low": round(price - move_abs, 2),
        "high": round(price + move_abs, 2),
        "iv_pct": round(iv * 100, 1) if iv else None,
        "expiry": expiry,
    }


def expected_move_for(price: Optional[float], history: Optional[list], *,
                      fetch: Optional[Callable] = None) -> Optional[dict]:
    """Best available next-session band for one symbol, or None."""
    if not price or price <= 0:
        return None

    # 1) Options-implied, when available.
    if fetch is not None:
        try:
            opt = fetch(price)      # -> {"iv": float, "expiry": str} | None
        except Exception:           # noqa: BLE001 - options are optional
            opt = None
        if opt and opt.get("iv"):
            move = implied_daily_move(price, opt["iv"])
            if move:
                return _band(price, move, "options", iv=opt["iv"],
                             expiry=opt.get("expiry"))

    # 2) Recent-volatility fallback.
    vol = daily_vol_from_prices(history or [])
    if vol:
        return _band(price, price * vol, "historical")
    return None


def _default_fetch_factory(symbol: str):
    """Return a price->{iv,expiry} fetcher backed by yfinance options."""
    def _fetch(price: float):
        import yfinance as yf

        t = yf.Ticker(symbol)
        expiries = t.options
        if not expiries:
            return None
        expiry = expiries[0]
        oc = t.option_chain(expiry)

        def _rows(df):
            if df is None or getattr(df, "empty", True):
                return []
            cols = [c for c in ("strike", "impliedVolatility") if c in df.columns]
            return df[cols].to_dict("records") if cols else []

        iv = pick_atm_iv(_rows(oc.calls), _rows(oc.puts), price)
        return {"iv": iv, "expiry": expiry} if iv else None

    return _fetch


def get_expected_moves(symbols: list, prices_by_symbol: dict,
                       history_by_symbol: Optional[dict] = None, *,
                       make_fetch: Optional[Callable[[str], Callable]] = None,
                       today: Optional[date] = None) -> dict:
    """Per-symbol next-session expected band. Resilient; omits on no data.

    make_fetch(symbol) -> (price -> {"iv","expiry"}|None). Defaults to the
    yfinance options fetcher. history_by_symbol feeds the volatility fallback.
    """
    history_by_symbol = history_by_symbol or {}
    make_fetch = make_fetch if make_fetch is not None else _default_fetch_factory
    out: dict[str, dict] = {}
    for sym in symbols:
        price = (prices_by_symbol.get(sym) or {}).get("current_price")
        fetch = make_fetch(sym) if make_fetch else None
        band = expected_move_for(price, history_by_symbol.get(sym), fetch=fetch)
        if band:
            out[sym] = band
    return out
