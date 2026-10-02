"""'Why it moved' explainer (optional, Anthropic API).

Given a holding's daily move and its top news headlines, asks Claude for a
one-sentence, news-grounded likely reason for the move. Strictly optional:
without ANTHROPIC_API_KEY it no-ops (returns ""). The Anthropic client is
injectable so the logic is unit-tested offline without a network or a key.

The output is a *possible* driver inferred only from the provided headlines —
not verified causation, and not investment advice.
"""

from __future__ import annotations

import os
from typing import Optional

import config

MODEL = getattr(config, "EXPLAIN_MODEL", "claude-haiku-4-5")

SYSTEM = (
    "You explain, in ONE short plain-language sentence, why a stock or ETF is "
    "priced where it is today, using ONLY the news headlines provided. Make "
    "clear whether the news reads as good or bad for the price (e.g. 'up on …', "
    "'down on …'). If the day's move is small or the headlines do not clearly "
    "explain the price, say there is no major stock-specific news today and it "
    "is tracking the broader market/sector. Never give advice or predictions, "
    "and never invent facts that are not in the headlines."
)


def _default_client():
    import anthropic

    return anthropic.Anthropic()  # resolves ANTHROPIC_API_KEY from env


def generate(symbol: str, change_pct: float, news_items: list,
             client=None, model: str = MODEL) -> str:
    """Return a one-sentence likely reason for the move, or "" if unavailable."""
    if not news_items:
        return ""

    if client is None:
        if not os.environ.get("ANTHROPIC_API_KEY"):
            return ""
        try:
            client = _default_client()
        except Exception:  # noqa: BLE001 - explainer is optional
            return ""

    heads = "\n".join(
        f"- {n.get('title', '')} ({n.get('source', 'n/a')})" for n in news_items[:4]
    )
    if change_pct > 0:
        move = f"up {change_pct:.1f}%"
    elif change_pct < 0:
        move = f"down {abs(change_pct):.1f}%"
    else:
        move = "roughly flat (0.0%)"
    prompt = (
        f"{symbol} is {move} today.\n"
        f"Headlines:\n{heads}\n\n"
        "In one sentence, why is it priced where it is today — and is the news "
        "good or bad for the price — based only on these headlines?"
    )

    try:
        resp = client.messages.create(
            model=model,
            max_tokens=150,
            system=SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )
        for block in resp.content:
            if getattr(block, "type", None) == "text":
                return block.text.strip()
        return ""
    except Exception:  # noqa: BLE001 - never let the explainer break a run
        return ""
