"""HTML briefing renderer (web delivery channel).

Renders the same structured data as report.py into a single self-contained
HTML page suitable for GitHub Pages or emailing as HTML. No external assets,
no JS — inline CSS only, light/dark aware via prefers-color-scheme.

SECURITY: news titles, sources, and URLs are external (from Yahoo). Every
interpolated string is HTML-escaped, and link URLs are scheme-checked
(http/https only) so a hostile headline cannot inject markup or a
javascript: URI. Numeric/derived fields from our own collectors are trusted.
"""

from __future__ import annotations

import html
from datetime import date
from typing import Optional
from urllib.parse import urlparse

DISCLAIMER = (
    "This is automated research/informational content generated from a "
    "transparent, rules-based screen. It is NOT investment advice and makes "
    "no prediction of returns."
)


def _esc(value) -> str:
    """HTML-escape any value (quotes included)."""
    return html.escape(str(value), quote=True)


def _safe_url(url: str) -> Optional[str]:
    """Return the URL only if it is a plain http(s) link, else None."""
    if not url:
        return None
    try:
        parsed = urlparse(url)
    except ValueError:
        return None
    if parsed.scheme in ("http", "https") and parsed.netloc:
        return url
    return None


def _chg_class(pct: float) -> str:
    return "up" if pct > 0 else "down" if pct < 0 else "flat"


def _index_tiles(indices: Optional[dict]) -> str:
    if not indices:
        return '<p class="muted">Index snapshot not collected this run.</p>'
    tiles = []
    for sym in sorted(indices):
        ix = indices[sym]
        pct = ix["change_pct"]
        sign = "+" if pct > 0 else ""
        tiles.append(
            f'<div class="tile {_chg_class(pct)}">'
            f'<div class="tile-name">{_esc(ix.get("name", sym))}</div>'
            f'<div class="tile-level">{_esc(ix["level"])}</div>'
            f'<div class="tile-chg">{sign}{_esc(pct)}%</div>'
            f"</div>"
        )
    return f'<div class="tiles">{"".join(tiles)}</div>'


def _movers_rows(ranked: list[dict]) -> str:
    rows = []
    for i, r in enumerate(ranked, 1):
        rows.append(
            "<tr>"
            f"<td>{i}</td>"
            f'<td class="sym">{_esc(r["symbol"])}</td>'
            f"<td>{_esc(r.get('sector') or '—')}</td>"
            f'<td class="num">{_esc(r["score"])}/{_esc(r["max_score"])}</td>'
            f'<td class="num">${_esc(r["price"])}</td>'
            f'<td class="num {_chg_class(r["change_pct"])}">{_esc(r["change_pct"])}</td>'
            f'<td class="num">{_esc(r["volume_ratio"])}×</td>'
            f'<td class="num">{_esc(r["rsi"])}</td>'
            "</tr>"
        )
    return "\n".join(rows)


def _why_blocks(ranked: list[dict], top_n: int = 5) -> str:
    blocks = []
    for r in ranked[:top_n]:
        reasons = "".join(f"<li>{_esc(x)}</li>" for x in r["reasons"]) or "<li>(no positive factors)</li>"
        blocks.append(
            f'<details><summary><b>{_esc(r["symbol"])}</b> — score '
            f'{_esc(r["score"])}/{_esc(r["max_score"])}</summary>'
            f"<ul>{reasons}</ul></details>"
        )
    return "".join(blocks) if blocks else '<p class="muted">No candidates.</p>'


def _developments(news_by_symbol: Optional[dict]) -> str:
    news_by_symbol = news_by_symbol or {}
    items = []
    for sym in sorted(news_by_symbol):
        for it in news_by_symbol[sym]:
            items.append(
                f"<li><b>{_esc(sym)}</b>: {_esc(it['title'])} "
                f'<span class="muted">({_esc(it.get("source", "n/a"))}, '
                f"{_esc(it.get('published_at', ''))})</span></li>"
            )
    return f"<ul>{''.join(items)}</ul>" if items else '<p class="muted">No clearly relevant developments today.</p>'


def _concerns(ranked: list[dict]) -> str:
    flagged = [r for r in ranked if r["concerns"]]
    if not flagged:
        return '<p class="muted">No risk flags raised by the screen.</p>'
    blocks = []
    for r in flagged:
        items = "".join(f"<li>{_esc(c)}</li>" for c in r["concerns"])
        blocks.append(f'<p><b>{_esc(r["symbol"])}</b></p><ul>{items}</ul>')
    return "".join(blocks)


def _sources(news_by_symbol: Optional[dict]) -> str:
    news_by_symbol = news_by_symbol or {}
    links = []
    for sym in sorted(news_by_symbol):
        for it in news_by_symbol[sym]:
            url = _safe_url(it.get("url", ""))
            label = f"{_esc(sym)}: {_esc(it['title'])}"
            if url:
                links.append(f'<li><a href="{_esc(url)}" rel="noopener noreferrer">{label}</a></li>')
            else:
                links.append(f"<li>{label}</li>")
    return f"<ul>{''.join(links)}</ul>" if links else '<p class="muted">Price/volume data via yfinance; no news links today.</p>'


_CSS = """
:root {
  --bg: #ffffff; --fg: #1a1d21; --muted: #6b7280; --card: #f5f6f8;
  --border: #e3e6ea; --up: #128a4b; --down: #c02626; --accent: #2f6feb;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f1216; --fg: #e6e8eb; --muted: #9aa3ad; --card: #171b21;
    --border: #262b32; --up: #3fb768; --down: #ef5b5b; --accent: #6ea8fe;
  }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg);
  font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
.wrap { max-width: 880px; margin: 0 auto; padding: 24px 16px 64px; }
h1 { font-size: 1.5rem; margin: 0 0 4px; }
h2 { font-size: 1.05rem; margin: 32px 0 12px; padding-bottom: 6px;
  border-bottom: 1px solid var(--border); }
.muted { color: var(--muted); }
.date { color: var(--muted); margin: 0 0 8px; }
.tiles { display: flex; flex-wrap: wrap; gap: 10px; }
.tile { flex: 1 1 120px; background: var(--card); border: 1px solid var(--border);
  border-radius: 10px; padding: 12px; }
.tile-name { font-size: .8rem; color: var(--muted); }
.tile-level { font-size: 1.2rem; font-weight: 600; margin: 2px 0; }
.tile-chg { font-weight: 600; }
.up { color: var(--up); } .down { color: var(--down); } .flat { color: var(--muted); }
table { width: 100%; border-collapse: collapse; font-size: .92rem; }
th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid var(--border); }
th { color: var(--muted); font-weight: 600; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
td.sym { font-weight: 600; }
details { background: var(--card); border: 1px solid var(--border);
  border-radius: 8px; padding: 8px 12px; margin: 6px 0; }
summary { cursor: pointer; }
a { color: var(--accent); }
footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid var(--border);
  color: var(--muted); font-size: .85rem; }
"""


def build_html(ranked: list[dict], news_by_symbol: Optional[dict] = None,
               as_of: Optional[str] = None, indices: Optional[dict] = None) -> str:
    """Render the full standalone HTML briefing page."""
    as_of = as_of or date.today().isoformat()

    if ranked:
        advancers = sum(1 for r in ranked if r["change_pct"] > 0)
        decliners = sum(1 for r in ranked if r["change_pct"] < 0)
        avg = round(sum(r["change_pct"] for r in ranked) / len(ranked), 2)
        snapshot = (f"{len(ranked)} tickers tracked — {advancers} up, "
                    f"{decliners} down, average move {avg}%.")
        movers = (
            "<table><thead><tr>"
            "<th>#</th><th>Ticker</th><th>Sector</th><th class='num'>Score</th>"
            "<th class='num'>Price</th><th class='num'>Chg%</th>"
            "<th class='num'>Vol×</th><th class='num'>RSI</th>"
            f"</tr></thead><tbody>{_movers_rows(ranked)}</tbody></table>"
        )
    else:
        snapshot = "No data collected."
        movers = '<p class="muted">No candidates.</p>'

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Market Briefing — {_esc(as_of)}</title>
<style>{_CSS}</style>
</head>
<body>
<div class="wrap">
  <h1>Daily Market Intelligence Briefing</h1>
  <p class="date">{_esc(as_of)}</p>

  <h2>Market snapshot</h2>
  <p>{_esc(snapshot)}</p>
  {_index_tiles(indices)}

  <h2>Top movers / bullish candidates</h2>
  {movers}
  <h3>Why they scored</h3>
  {_why_blocks(ranked)}

  <h2>Earnings roundup</h2>
  <p class="muted">Not yet wired — no earnings collector yet (planned: Finnhub / Nasdaq calendar).</p>

  <h2>Notable developments</h2>
  {_developments(news_by_symbol)}

  <h2>Watch list / concerns</h2>
  {_concerns(ranked)}

  <h2>Sources</h2>
  {_sources(news_by_symbol)}

  <footer>{_esc(DISCLAIMER)}</footer>
</div>
</body>
</html>
"""


def save_html(markup: str, out_dir: str, as_of: Optional[str] = None,
              also_index: bool = True) -> str:
    """Write briefing_<date>.html (and index.html for GitHub Pages)."""
    import os

    as_of = as_of or date.today().isoformat()
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"briefing_{as_of}.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(markup)
    if also_index:
        with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8") as f:
            f.write(markup)
    return path
