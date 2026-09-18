"""Portfolio P&L engine (display-agnostic).

Computes current value and gain/loss for a set of holdings, given live prices.
Holdings (share counts + average cost) are SENSITIVE and are never committed:
they come from the PORTFOLIO_JSON environment variable (a GitHub Actions
secret), shaped like:

    {"cash": 177.54,
     "positions": {"NVDA": {"qty": 3, "cost": 201.14},
                    "PLTR": {"qty": 8, "cost": 151.77}}}

This module only does math; where (and whether) the numbers are shown is
decided by the caller. It makes no recommendation.
"""

from __future__ import annotations

import json
import os
from typing import Optional


def parse_portfolio(raw) -> dict:
    """Normalize a portfolio spec (dict or JSON string) to {positions, cash}."""
    if not raw:
        return {"positions": {}, "cash": 0.0}
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except (ValueError, TypeError):
            return {"positions": {}, "cash": 0.0}
    positions = raw.get("positions", {}) or {}

    def _num(key):
        try:
            return float(raw.get(key, 0) or 0)
        except (TypeError, ValueError):
            return 0.0

    # `adjustment` covers things like pending activity so the total can match
    # a broker statement.
    return {"positions": positions, "cash": _num("cash"), "adjustment": _num("adjustment")}


def from_env(var: str = "PORTFOLIO_JSON") -> dict:
    """Load and parse the portfolio from an environment variable."""
    return parse_portfolio(os.environ.get(var, ""))


def load(path: str = "holdings.json", env_var: str = "PORTFOLIO_JSON") -> dict:
    """Load holdings, preferring the env secret, then a committed JSON file."""
    raw = os.environ.get(env_var, "")
    if raw:
        return parse_portfolio(raw)
    try:
        with open(path, encoding="utf-8") as f:
            return parse_portfolio(f.read())
    except (OSError, ValueError):
        return {"positions": {}, "cash": 0.0, "adjustment": 0.0}


def compute(portfolio: dict, price_by_symbol: dict) -> dict:
    """Compute per-position and total P&L.

    price_by_symbol maps SYMBOL -> {current_price, prev_close}. A position
    whose price is missing is reported with status 'no-price' and excluded
    from the totals.
    """
    portfolio = parse_portfolio(portfolio)
    cash = portfolio["cash"]
    adjustment = portfolio.get("adjustment", 0.0)

    rows = []
    tot_value = 0.0
    tot_basis = 0.0
    tot_day = 0.0

    for sym, h in portfolio["positions"].items():
        sym = sym.upper()
        try:
            qty = float(h["qty"])
            cost = float(h["cost"])
        except (KeyError, TypeError, ValueError):
            continue

        p = price_by_symbol.get(sym)
        if not p or p.get("current_price") in (None, ""):
            rows.append({"symbol": sym, "status": "no-price", "qty": qty, "cost": cost})
            continue

        price = float(p["current_price"])
        prev = float(p.get("prev_close", price) or price)
        value = qty * price
        basis = qty * cost
        gain = value - basis
        day_change = qty * (price - prev)

        rows.append({
            "symbol": sym,
            "status": "ok",
            "qty": qty,
            "cost": round(cost, 2),
            "price": round(price, 2),
            "value": round(value, 2),
            "basis": round(basis, 2),
            "gain": round(gain, 2),
            "gain_pct": round(gain / basis * 100, 2) if basis else 0.0,
            "day_change": round(day_change, 2),
            "day_change_pct": round((price - prev) / prev * 100, 2) if prev else 0.0,
        })
        tot_value += value
        tot_basis += basis
        tot_day += day_change

    total_assets = tot_value + cash + adjustment
    total_gain = tot_value - tot_basis
    rows.sort(key=lambda r: r.get("value", 0), reverse=True)

    return {
        "rows": rows,
        "cash": round(cash, 2),
        "adjustment": round(adjustment, 2),
        "positions_value": round(tot_value, 2),
        "total_assets": round(total_assets, 2),
        "total_basis": round(tot_basis, 2),
        "total_gain": round(total_gain, 2),
        "total_gain_pct": round(total_gain / tot_basis * 100, 2) if tot_basis else 0.0,
        "day_change": round(tot_day, 2),
    }


def has_holdings(portfolio: Optional[dict]) -> bool:
    return bool(parse_portfolio(portfolio)["positions"])
