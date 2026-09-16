"""Transparent, rules-based ranking screen (build plan step 4).

Combines the collected signals into a single weighted score with a
human-readable breakdown, so every entry on the watchlist is auditable —
this is a screen, NOT a prediction of returns and NOT investment advice.

Inputs per symbol:
  - a price snapshot dict (from collectors.prices / store)
  - optional ranked news items (from collectors.news)

Each factor is a small pure function returning (points, reason) or None.
The score is the sum of triggered factor points. Concerns (risk flags) are
tracked separately so the report can surface them even for high scorers.
"""

from __future__ import annotations

from typing import Optional

# Weights are explicit and tunable (build plan: "iterate on weights once you
# see real output"). Keep them here so the screen stays auditable.
WEIGHTS = {
    "above_ma_short": 1.0,      # price above its short moving average
    "uptrend_stack": 1.5,       # short MA above long MA (trend structure)
    "positive_momentum": 1.0,   # up on the day
    "unusual_volume": 1.0,      # volume well above its own average
    "rsi_healthy": 1.0,         # RSI in a constructive band
    "news_catalyst": 1.0,       # at least one relevant, high-scoring headline
}

UNUSUAL_VOLUME_RATIO = 1.5
RSI_HEALTHY_LOW = 45.0
RSI_HEALTHY_HIGH = 70.0
RSI_OVERBOUGHT = 75.0


def _factors(snap: dict, news: Optional[list]) -> tuple[float, list[str], list[str]]:
    """Return (score, reasons, concerns) for one symbol."""
    score = 0.0
    reasons: list[str] = []
    concerns: list[str] = []

    price = snap["current_price"]
    ma_short = snap["ma_short"]
    ma_long = snap["ma_long"]

    if price > ma_short:
        score += WEIGHTS["above_ma_short"]
        reasons.append(f"Price ${price} above short MA ${ma_short}")
    else:
        concerns.append(f"Price ${price} at/below short MA ${ma_short}")

    if ma_short > ma_long:
        score += WEIGHTS["uptrend_stack"]
        reasons.append(f"Uptrend structure (short MA ${ma_short} > long MA ${ma_long})")
    else:
        concerns.append("Moving averages not in an uptrend stack")

    if snap["change_pct"] > 0:
        score += WEIGHTS["positive_momentum"]
        reasons.append(f"Up {snap['change_pct']}% on the day")
    elif snap["change_pct"] < 0:
        concerns.append(f"Down {snap['change_pct']}% on the day")

    if snap["volume_ratio"] >= UNUSUAL_VOLUME_RATIO:
        score += WEIGHTS["unusual_volume"]
        reasons.append(f"Unusual volume: {snap['volume_ratio']}x 20-day average")

    rsi = snap["rsi"]
    if RSI_HEALTHY_LOW <= rsi < RSI_HEALTHY_HIGH:
        score += WEIGHTS["rsi_healthy"]
        reasons.append(f"RSI {rsi} in a healthy band")
    elif rsi >= RSI_OVERBOUGHT:
        concerns.append(f"RSI {rsi} overbought — pullback risk")
    elif rsi < RSI_HEALTHY_LOW:
        concerns.append(f"RSI {rsi} weak momentum")

    top_news = (news or [])
    if top_news:
        best = max(top_news, key=lambda a: a.get("relevance_score", 0))
        score += WEIGHTS["news_catalyst"]
        reasons.append(
            f"Relevant news: \"{best['title']}\" "
            f"({best.get('source', 'n/a')}, score={best.get('relevance_score')})"
        )

    return round(score, 2), reasons, concerns


def score_symbol(snap: dict, news: Optional[list] = None) -> dict:
    """Score one symbol and return an auditable record."""
    score, reasons, concerns = _factors(snap, news)
    return {
        "symbol": snap["symbol"],
        "sector": snap.get("sector"),
        "score": score,
        "max_score": round(sum(WEIGHTS.values()), 2),
        "price": snap["current_price"],
        "change_pct": snap["change_pct"],
        "volume_ratio": snap["volume_ratio"],
        "rsi": snap["rsi"],
        "reasons": reasons,
        "concerns": concerns,
    }


def rank(snapshots: list[dict], news_by_symbol: Optional[dict] = None) -> list[dict]:
    """Score and rank symbols, highest score first (ties: bigger daily move)."""
    news_by_symbol = news_by_symbol or {}
    scored = [
        score_symbol(s, news_by_symbol.get(s["symbol"]))
        for s in snapshots
    ]
    scored.sort(key=lambda r: (r["score"], r["change_pct"]), reverse=True)
    return scored
