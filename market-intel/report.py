"""Markdown daily-briefing generator (build plan step 5).

Turns the ranked screen + collected news into a readable report. Markdown
first (easiest to review). Sections follow the build plan's report structure;
sections whose collectors don't exist yet (earnings, index snapshot) are
shown as explicit "not yet wired" placeholders rather than faked.

Output is informational only — a disclaimer line is always included.
"""

from __future__ import annotations

from datetime import date
from typing import Optional

DISCLAIMER = (
    "_This is automated research/informational content generated from a "
    "transparent, rules-based screen. It is NOT investment advice and makes "
    "no prediction of returns._"
)


def _snapshot_line(ranked: list[dict]) -> str:
    if not ranked:
        return "No data collected."
    advancers = sum(1 for r in ranked if r["change_pct"] > 0)
    decliners = sum(1 for r in ranked if r["change_pct"] < 0)
    avg = round(sum(r["change_pct"] for r in ranked) / len(ranked), 2)
    return (
        f"{len(ranked)} tickers tracked — {advancers} up, {decliners} down, "
        f"average move {avg}%."
    )


def _indices_table(indices: Optional[dict]) -> str:
    """Render the market-index snapshot table, or a placeholder if absent."""
    if not indices:
        return "> Index/sector-level snapshot: _not collected this run_."
    lines = [
        "| Index | Level | Chg% |",
        "|-------|------:|-----:|",
    ]
    for sym in sorted(indices):
        ix = indices[sym]
        lines.append(f"| {ix.get('name', sym)} | {ix['level']} | {ix['change_pct']} |")
    return "\n".join(lines)


def _movers_table(ranked: list[dict], top_n: int = 10) -> str:
    if not ranked:
        return "_No candidates._"
    lines = [
        "| Rank | Ticker | Sector | Score | Price | Chg% | Vol× | RSI |",
        "|-----:|--------|--------|------:|------:|-----:|-----:|----:|",
    ]
    for i, r in enumerate(ranked[:top_n], 1):
        lines.append(
            f"| {i} | {r['symbol']} | {r.get('sector') or '—'} | "
            f"{r['score']}/{r['max_score']} | ${r['price']} | {r['change_pct']} | "
            f"{r['volume_ratio']} | {r['rsi']} |"
        )
    return "\n".join(lines)


def _why_blocks(ranked: list[dict], top_n: int = 5) -> str:
    blocks = []
    for r in ranked[:top_n]:
        reasons = "\n".join(f"  - {x}" for x in r["reasons"]) or "  - (no positive factors)"
        blocks.append(f"**{r['symbol']}** — score {r['score']}/{r['max_score']}\n{reasons}")
    return "\n\n".join(blocks) if blocks else "_No candidates._"


def _concerns_section(ranked: list[dict]) -> str:
    flagged = [r for r in ranked if r["concerns"]]
    if not flagged:
        return "_No risk flags raised by the screen._"
    lines = []
    for r in flagged:
        items = "\n".join(f"  - {c}" for c in r["concerns"])
        lines.append(f"**{r['symbol']}**\n{items}")
    return "\n\n".join(lines)


def _developments_section(news_by_symbol: Optional[dict]) -> str:
    news_by_symbol = news_by_symbol or {}
    lines = []
    for sym in sorted(news_by_symbol):
        for item in news_by_symbol[sym]:
            lines.append(
                f"- **{sym}**: {item['title']} "
                f"({item.get('source', 'n/a')}, {item.get('published_at', '')})"
            )
    return "\n".join(lines) if lines else "_No clearly relevant developments today._"


def _sources_section(news_by_symbol: Optional[dict]) -> str:
    news_by_symbol = news_by_symbol or {}
    urls = []
    for sym in sorted(news_by_symbol):
        for item in news_by_symbol[sym]:
            if item.get("url"):
                urls.append(f"- [{sym}: {item['title']}]({item['url']})")
    return "\n".join(urls) if urls else "_Price/volume data via yfinance; no news links today._"


def _earnings_md(earnings: Optional[dict]) -> str:
    earnings = earnings or {}
    if not earnings:
        return "_No earnings in the recent/upcoming window (or Finnhub key not set)._"
    lines = []
    for sym in sorted(earnings):
        e = earnings[sym]
        status = e["status"].title()
        if e["eps_actual"] is not None:
            sp = e["eps_surprise_pct"]
            sp_txt = f" ({sp:+}%)" if sp is not None else ""
            eps = f"EPS {e['eps_actual']} vs {e['eps_estimate']} est{sp_txt}"
        else:
            eps = f"EPS est {e['eps_estimate']}"
        lines.append(f"- **{sym}** — {status} ({e['date']} {e['hour']}): {eps}")
    return "\n".join(lines)


def build_report(ranked: list[dict], news_by_symbol: Optional[dict] = None,
                 as_of: Optional[str] = None, indices: Optional[dict] = None,
                 earnings: Optional[dict] = None) -> str:
    """Assemble the full Markdown briefing."""
    as_of = as_of or date.today().isoformat()

    return f"""# Daily Market Intelligence Briefing — {as_of}

## 1. Market snapshot
{_snapshot_line(ranked)}

{_indices_table(indices)}

## 2. Top movers / bullish candidates
{_movers_table(ranked)}

### Why they scored
{_why_blocks(ranked)}

## 3. Earnings roundup
{_earnings_md(earnings)}

## 4. Notable developments
{_developments_section(news_by_symbol)}

## 5. Watch list / concerns
{_concerns_section(ranked)}

## 6. Sources
{_sources_section(news_by_symbol)}

---
{DISCLAIMER}
"""


def save_report(markdown: str, out_dir: str, as_of: Optional[str] = None) -> str:
    """Write the report to <out_dir>/briefing_<date>.md and return the path."""
    import os

    as_of = as_of or date.today().isoformat()
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"briefing_{as_of}.md")
    with open(path, "w", encoding="utf-8") as f:
        f.write(markdown)
    return path
