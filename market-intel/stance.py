"""Per-holding daily stance (rules-based signal — NOT investment advice).

Turns a ranking record + the day's news into a plain-language daily "read"
for each stock: a stance label, a one-line lean, a nuance note (including the
"extended, may be better to wait for a pullback" case), and the top news
summary. Everything is derived transparently from the same rules the screen
already uses — there is no hidden model and no recommendation to trade.

Stance labels (mechanical, ordered most→least constructive):
    Constructive · Watch · Neutral · Cautious
"""

from __future__ import annotations

from typing import Optional

import config

CONSTRUCTIVE_RATIO = getattr(config, "STANCE_CONSTRUCTIVE_RATIO", 0.72)
WATCH_RATIO = getattr(config, "STANCE_WATCH_RATIO", 0.42)

# One-line disclaimer surfaced with the stance section.
STANCE_DISCLAIMER = (
    "Stance is a mechanical read of the rules-based screen, not a "
    "recommendation to buy or sell."
)


def _flags(record: dict) -> dict:
    concerns = [c.lower() for c in record.get("concerns", [])]
    return {
        "overbought": any("overbought" in c for c in concerns),
        "below_ma": any("at/below short ma" in c for c in concerns),
        "no_stack": any("uptrend stack" in c for c in concerns),
        "weak_momo": any("weak momentum" in c for c in concerns),
        "down_day": any("down" in c and "on the day" in c for c in concerns),
    }


def classify(record: dict) -> dict:
    """Return {stance, lean, note} for one ranking record."""
    score = record["score"]
    mx = record["max_score"] or 1
    ratio = score / mx
    f = _flags(record)

    # Overbought takes priority: constructive trend but extended.
    if f["overbought"] and ratio >= 0.5:
        return {
            "stance": "Cautious",
            "lean": "Bullish trend, but extended",
            "note": ("The trend is strong, but the screen flags the stock as "
                     "overbought — historically, better entries have tended to "
                     "come after it cools off rather than chasing it here."),
        }

    # Clean, strong setup (and not trading below its own short MA).
    if ratio >= CONSTRUCTIVE_RATIO and not f["below_ma"]:
        return {
            "stance": "Constructive",
            "lean": "Momentum, trend and volume are aligned",
            "note": "Most of the screen's constructive factors are firing today.",
        }

    # Genuinely weak: below its moving average or fading momentum.
    if f["below_ma"] or f["weak_momo"]:
        return {
            "stance": "Cautious",
            "lean": "Trend / momentum look weak",
            "note": ("The screen is not seeing constructive factors today; it "
                     "would rather wait for the trend to turn than lean in now."),
        }

    # Mixed but holding up (e.g. above its MA but not a full uptrend stack).
    if ratio >= WATCH_RATIO:
        return {
            "stance": "Watch",
            "lean": "Partly constructive, mixed signals",
            "note": "Some factors are positive but it is not a clean setup yet.",
        }

    return {
        "stance": "Neutral",
        "lean": "No strong signal either way",
        "note": "The screen sees a mixed-to-quiet picture for this name today.",
    }


def build_stance(record: dict, news_items: Optional[list] = None) -> dict:
    """Full per-symbol stance record, including the top news summary."""
    verdict = classify(record)

    top_news = None
    if news_items:
        best = max(news_items, key=lambda a: a.get("relevance_score", 0))
        # A quiet name with real news today is worth watching.
        if verdict["stance"] == "Neutral":
            verdict = {
                "stance": "Watch",
                "lean": "Quiet on the screen, but in the news today",
                "note": "No strong technical signal, but there's fresh news worth reading.",
            }
        top_news = {
            "title": best.get("title", ""),
            "source": best.get("source", ""),
            "published_at": best.get("published_at", ""),
            "summary": best.get("description", ""),
            "url": best.get("url", ""),
        }

    return {
        "symbol": record["symbol"],
        "sector": record.get("sector"),
        "stance": verdict["stance"],
        "lean": verdict["lean"],
        "note": verdict["note"],
        "score": record["score"],
        "max_score": record["max_score"],
        "change_pct": record["change_pct"],
        "rsi": record["rsi"],
        "reasons": record.get("reasons", [])[:3],
        "concerns": record.get("concerns", []),
        "news": top_news,
    }


def build_stances(ranked: list[dict], news_by_symbol: Optional[dict] = None) -> list[dict]:
    """Build stance records for every ranked symbol (keeps ranked order)."""
    news_by_symbol = news_by_symbol or {}
    return [build_stance(r, news_by_symbol.get(r["symbol"])) for r in ranked]
