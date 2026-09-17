"""HTML briefing renderer (web delivery channel).

Renders the same structured data as report.py into a single self-contained
HTML page suitable for GitHub Pages or emailing as HTML. No external assets,
no JS — inline CSS only, light/dark aware via prefers-color-scheme.

Design: layered surfaces (not flat white), a hero header with stat tiles,
sector-tagged cards, and semantic up/down colors that ALWAYS pair with an
arrow + sign so direction never depends on color alone (accessibility).

SECURITY: news titles, summaries, sources and URLs are external (from Yahoo).
Every interpolated string is HTML-escaped, and link URLs are scheme-checked
(http/https only) so a hostile headline cannot inject markup or a javascript:
URI. Numeric/derived fields from our own collectors are trusted.
"""

from __future__ import annotations

import html
import re
from datetime import date
from typing import Optional
from urllib.parse import urlparse

import sparkline

DISCLAIMER = (
    "This is automated research/informational content generated from a "
    "transparent, rules-based screen. It is NOT investment advice and makes "
    "no prediction of returns."
)


def _esc(value) -> str:
    return html.escape(str(value), quote=True)


def _safe_url(url: str) -> Optional[str]:
    if not url:
        return None
    try:
        parsed = urlparse(url)
    except ValueError:
        return None
    if parsed.scheme in ("http", "https") and parsed.netloc:
        return url
    return None


def _summarize(text: str, max_chars: int = 320) -> str:
    """Trim a summary to ~2-3 sentences, cutting on a sentence boundary."""
    text = (text or "").strip()
    if not text:
        return ""
    if len(text) <= max_chars:
        return text
    window = text[:max_chars]
    # Prefer to end on the last sentence terminator within the window.
    m = list(re.finditer(r"[.!?]\s", window))
    if m:
        return window[: m[-1].end()].strip()
    return window.rsplit(" ", 1)[0].strip() + "…"


def _arrow(pct: float) -> str:
    return "▲" if pct > 0 else "▼" if pct < 0 else "•"


def _chg_class(pct: float) -> str:
    return "up" if pct > 0 else "down" if pct < 0 else "flat"


def _signed(pct) -> str:
    return f"+{pct}" if isinstance(pct, (int, float)) and pct > 0 else f"{pct}"


# --------------------------------------------------------------------------- #
# Sections
# --------------------------------------------------------------------------- #
def _stat_tiles(ranked: list[dict]) -> str:
    if not ranked:
        return ""
    advancers = sum(1 for r in ranked if r["change_pct"] > 0)
    decliners = sum(1 for r in ranked if r["change_pct"] < 0)
    avg = round(sum(r["change_pct"] for r in ranked) / len(ranked), 2)
    avg_cls = _chg_class(avg)
    return (
        '<div class="stats">'
        f'<div class="stat"><div class="stat-k">Tracked</div><div class="stat-v">{len(ranked)}</div></div>'
        f'<div class="stat"><div class="stat-k">Advancing</div><div class="stat-v up">{advancers} ▲</div></div>'
        f'<div class="stat"><div class="stat-k">Declining</div><div class="stat-v down">{decliners} ▼</div></div>'
        f'<div class="stat"><div class="stat-k">Avg move</div><div class="stat-v {avg_cls}">{_arrow(avg)} {_signed(avg)}%</div></div>'
        "</div>"
    )


def _index_tiles(indices: Optional[dict]) -> str:
    if not indices:
        return '<p class="muted">Index snapshot not collected this run.</p>'
    tiles = []
    for sym in sorted(indices):
        ix = indices[sym]
        pct = ix["change_pct"]
        cls = _chg_class(pct)
        tiles.append(
            f'<div class="tile">'
            f'<div class="tile-name">{_esc(ix.get("name", sym))}</div>'
            f'<div class="tile-level">{_esc(ix["level"])}</div>'
            f'<div class="tile-chg {cls}">{_arrow(pct)} {_signed(pct)}%</div>'
            f"</div>"
        )
    return f'<div class="tiles">{"".join(tiles)}</div>'


_STANCE_CLASS = {
    "Constructive": "st-good",
    "Watch": "st-watch",
    "Neutral": "st-neutral",
    "Cautious": "st-warn",
}


def _stance_section(stances: Optional[list], disclaimer: str) -> str:
    if not stances:
        return ""
    cards = []
    for s in stances:
        badge_cls = _STANCE_CLASS.get(s["stance"], "st-neutral")
        pct = s["change_pct"]
        news_html = ""
        if s.get("news"):
            n = s["news"]
            url = _safe_url(n.get("url", ""))
            title = _esc(n["title"])
            headline = f'<a href="{_esc(url)}" rel="noopener noreferrer">{title}</a>' if url else title
            summary = _summarize(n.get("summary", ""))
            summary_html = f'<p class="dev-summary">{_esc(summary)}</p>' if summary else ""
            news_html = (
                '<div class="stance-news"><div class="stance-news-k">Today\'s news</div>'
                f'<div class="stance-news-t">{headline} '
                f'<span class="muted">· {_esc(n.get("source", ""))}</span></div>{summary_html}</div>'
            )
        else:
            news_html = ('<div class="stance-news"><div class="stance-news-k">Today\'s news</div>'
                         '<p class="muted">No clearly relevant news today.</p></div>')

        cards.append(
            '<article class="stance-card">'
            '<div class="stance-top">'
            f'<span class="chip">{_esc(s["symbol"])}</span>'
            f'<span class="badge {badge_cls}">{_esc(s["stance"])}</span>'
            f'<span class="muted stance-sector">{_esc(s.get("sector") or "")}</span>'
            f'<span class="num {_chg_class(pct)} stance-chg">{_arrow(pct)} {_signed(pct)}%</span>'
            "</div>"
            f'<div class="stance-lean">{_esc(s["lean"])}</div>'
            f'<p class="stance-note">{_esc(s["note"])}</p>'
            f"{news_html}"
            "</article>"
        )
    return (
        f'<p class="muted disclaimer-line">{_esc(disclaimer)}</p>'
        f'<div class="stance-grid">{"".join(cards)}</div>'
    )


def _fmt_money(v) -> str:
    """Compact money formatting for revenue figures."""
    if v is None:
        return "—"
    try:
        v = float(v)
    except (TypeError, ValueError):
        return "—"
    for unit, size in (("B", 1e9), ("M", 1e6), ("K", 1e3)):
        if abs(v) >= size:
            return f"${v / size:.2f}{unit}"
    return f"${v:.0f}"


_EARN_BADGE = {"beat": "st-good", "miss": "st-warn", "inline": "st-neutral",
               "reported": "st-neutral", "upcoming": "st-watch"}
_EARN_LABEL = {"beat": "Beat", "miss": "Miss", "inline": "In line",
               "reported": "Reported", "upcoming": "Upcoming"}


def _earnings_section(earnings: Optional[dict]) -> str:
    if not earnings:
        return ('<p class="muted">No earnings in the recent/upcoming window '
                '(or Finnhub key not set).</p>')
    cards = []
    for sym in sorted(earnings):
        e = earnings[sym]
        badge = _EARN_BADGE.get(e["status"], "st-neutral")
        label = _EARN_LABEL.get(e["status"], e["status"].title())

        def _surprise(pct):
            if pct is None:
                return ""
            cls = "up" if pct > 0 else "down" if pct < 0 else "flat"
            return f' <span class="num {cls}">({_signed(pct)}%)</span>'

        eps = (f'EPS <b>{_esc(e["eps_actual"])}</b> vs {_esc(e["eps_estimate"])} est'
               f'{_surprise(e["eps_surprise_pct"])}' if e["eps_actual"] is not None
               else f'EPS est {_esc(e["eps_estimate"])}')
        rev = (f'Rev <b>{_fmt_money(e["rev_actual"])}</b> vs {_fmt_money(e["rev_estimate"])} est'
               f'{_surprise(e["rev_surprise_pct"])}' if e["rev_actual"] is not None
               else f'Rev est {_fmt_money(e["rev_estimate"])}')

        cards.append(
            '<article class="dev">'
            '<div class="dev-head">'
            f'<span class="chip">{_esc(sym)}</span>'
            f'<span class="badge {badge}">{_esc(label)}</span>'
            f'<span class="muted">{_esc(e["date"])} {_esc(e["hour"])}</span>'
            "</div>"
            f'<p class="dev-summary">{eps}<br>{rev}</p>'
            "</article>"
        )
    return "".join(cards)


def _movers_rows(ranked: list[dict], history_by_symbol: Optional[dict] = None) -> str:
    history_by_symbol = history_by_symbol or {}
    rows = []
    for i, r in enumerate(ranked, 1):
        series = history_by_symbol.get(r["symbol"]) or []
        spark = sparkline.build_svg(series) if len(series) >= 2 else '<span class="muted">—</span>'
        pct = r["change_pct"]
        # Score bar (share of max) as a subtle strength meter.
        pct_of_max = (r["score"] / r["max_score"] * 100) if r["max_score"] else 0
        rows.append(
            "<tr>"
            f'<td class="rank">{i}</td>'
            f'<td class="sym">{_esc(r["symbol"])}</td>'
            f'<td class="sector">{_esc(r.get("sector") or "—")}</td>'
            f'<td class="spark-cell">{spark}</td>'
            f'<td class="score"><span class="score-num">{_esc(r["score"])}</span>'
            f'<span class="bar"><span class="bar-fill" style="width:{pct_of_max:.0f}%"></span></span></td>'
            f'<td class="num">${_esc(r["price"])}</td>'
            f'<td class="num {_chg_class(pct)}">{_arrow(pct)} {_signed(pct)}</td>'
            f'<td class="num">{_esc(r["volume_ratio"])}×</td>'
            f'<td class="num">{_esc(r["rsi"])}</td>'
            "</tr>"
        )
    return "\n".join(rows)


def _why_blocks(ranked: list[dict], top_n: int = 6) -> str:
    blocks = []
    for r in ranked[:top_n]:
        reasons = "".join(f"<li>{_esc(x)}</li>" for x in r["reasons"]) or "<li>(no positive factors)</li>"
        blocks.append(
            f'<details><summary><span class="chip">{_esc(r["symbol"])}</span>'
            f'<span class="muted">score {_esc(r["score"])}/{_esc(r["max_score"])}</span></summary>'
            f"<ul>{reasons}</ul></details>"
        )
    return "".join(blocks) if blocks else '<p class="muted">No candidates.</p>'


def _developments(news_by_symbol: Optional[dict]) -> str:
    news_by_symbol = news_by_symbol or {}
    cards = []
    for sym in sorted(news_by_symbol):
        for it in news_by_symbol[sym]:
            url = _safe_url(it.get("url", ""))
            title = _esc(it["title"])
            headline = f'<a href="{_esc(url)}" rel="noopener noreferrer">{title}</a>' if url else title
            summary = _summarize(it.get("description", ""))
            summary_html = f'<p class="dev-summary">{_esc(summary)}</p>' if summary else ""
            cards.append(
                '<article class="dev">'
                f'<div class="dev-head"><span class="chip">{_esc(sym)}</span>'
                f'<span class="muted">{_esc(it.get("source", "n/a"))} · {_esc(it.get("published_at", ""))}</span></div>'
                f'<h4 class="dev-title">{headline}</h4>'
                f"{summary_html}"
                "</article>"
            )
    return "".join(cards) if cards else '<p class="muted">No clearly relevant developments today.</p>'


def _concerns(ranked: list[dict]) -> str:
    flagged = [r for r in ranked if r["concerns"]]
    if not flagged:
        return '<p class="muted">No risk flags raised by the screen.</p>'
    cards = []
    for r in flagged:
        items = "".join(f"<li>{_esc(c)}</li>" for c in r["concerns"])
        cards.append(f'<div class="concern"><span class="chip warn">{_esc(r["symbol"])}</span><ul>{items}</ul></div>')
    return f'<div class="concerns">{"".join(cards)}</div>'


def _sources(news_by_symbol: Optional[dict]) -> str:
    news_by_symbol = news_by_symbol or {}
    links = []
    for sym in sorted(news_by_symbol):
        for it in news_by_symbol[sym]:
            url = _safe_url(it.get("url", ""))
            label = f"{_esc(sym)}: {_esc(it['title'])}"
            links.append(
                f'<li><a href="{_esc(url)}" rel="noopener noreferrer">{label}</a></li>' if url
                else f"<li>{label}</li>"
            )
    return f"<ul class='sources'>{''.join(links)}</ul>" if links else \
        '<p class="muted">Price/volume data via yfinance; no news links today.</p>'


_CSS = """
:root {
  --bg:#f0f3fb; --card:#ffffff; --card-2:#f4f7ff; --border:#e0e7f5;
  --fg:#0d1526; --muted:#5a6782; --accent:#4361ff; --accent-ink:#2e46d6;
  --up:#00b368; --up-bg:#e2f8ee; --down:#f0384f; --down-bg:#fdeaed;
  --warn:#f59e0b; --warn-bg:#fef3e2;
  --hero-1:#4f46e5; --hero-2:#06b6d4;
  --shadow:0 2px 6px rgba(16,24,40,.10),0 1px 2px rgba(16,24,40,.05);
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg:#080b12; --card:#121724; --card-2:#0d1119; --border:#232c40;
    --fg:#eaeefb; --muted:#96a2bd; --accent:#6f8bff; --accent-ink:#a9bcff;
    --up:#1fd68a; --up-bg:#0e2b20; --down:#ff5a70; --down-bg:#331920;
    --warn:#fbbf24; --warn-bg:#2b2410;
    --hero-1:#4338ca; --hero-2:#0891b2; --shadow:0 2px 8px rgba(0,0,0,.55);
  }
}
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--fg);
  font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased; }
.wrap { max-width:960px; margin:0 auto; padding:0 16px 72px; }
.hero { background:linear-gradient(135deg,var(--hero-1),var(--hero-2)); color:#fff;
  border-radius:0 0 18px 18px; padding:28px 24px 24px; margin:0 -16px 24px;
  box-shadow:var(--shadow); }
.hero h1 { margin:0; font-size:1.5rem; letter-spacing:-.01em; }
.hero .date { opacity:.85; margin:4px 0 18px; font-size:.9rem; }
.stats { display:flex; flex-wrap:wrap; gap:10px; }
.stat { background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.16);
  border-radius:12px; padding:10px 14px; min-width:100px; }
.stat-k { font-size:.72rem; text-transform:uppercase; letter-spacing:.05em; opacity:.85; }
.stat-v { font-size:1.25rem; font-weight:700; margin-top:2px; }
.stat-v.up,.stat-v.down,.stat-v.flat { color:#fff; }  /* keep legible on hero */
h2 { font-size:1.05rem; margin:34px 0 14px; display:flex; align-items:center; gap:10px; }
h2::before { content:""; width:4px; height:1.05rem; background:var(--accent); border-radius:2px; }
h3 { font-size:.95rem; color:var(--muted); margin:20px 0 8px; }
.muted { color:var(--muted); }
.up { color:var(--up); } .down { color:var(--down); } .flat { color:var(--muted); }
.tiles { display:flex; flex-wrap:wrap; gap:12px; }
.tile { flex:1 1 150px; background:var(--card); border:1px solid var(--border);
  border-radius:14px; padding:14px 16px; box-shadow:var(--shadow); }
.tile-name { font-size:.8rem; color:var(--muted); }
.tile-level { font-size:1.35rem; font-weight:700; margin:4px 0 2px; font-variant-numeric:tabular-nums; }
.tile-chg { font-weight:600; font-variant-numeric:tabular-nums; }
.card { background:var(--card); border:1px solid var(--border); border-radius:14px;
  box-shadow:var(--shadow); overflow:hidden; }
table { width:100%; border-collapse:collapse; font-size:.92rem; }
thead th { background:var(--card-2); color:var(--muted); font-weight:600;
  text-align:left; padding:10px 12px; border-bottom:1px solid var(--border);
  font-size:.78rem; text-transform:uppercase; letter-spacing:.03em; }
tbody td { padding:10px 12px; border-bottom:1px solid var(--border);
  font-variant-numeric:tabular-nums; }
tbody tr:last-child td { border-bottom:none; }
tbody tr:hover { background:var(--card-2); }
td.num, th.num { text-align:right; }
td.rank { color:var(--muted); width:28px; }
td.sym { font-weight:700; }
td.sector { color:var(--muted); font-size:.85rem; }
.spark-cell { width:104px; }
.spark { display:block; }
.spark.up { color:var(--up); } .spark.down { color:var(--down); } .spark.flat { color:var(--muted); }
td.score { min-width:120px; }
.score-num { font-weight:600; margin-right:8px; }
.bar { display:inline-block; width:60px; height:6px; background:var(--border);
  border-radius:4px; vertical-align:middle; overflow:hidden; }
.bar-fill { display:block; height:100%; background:var(--accent); }
.chip { display:inline-block; font-weight:700; font-size:.8rem; padding:2px 8px;
  border-radius:999px; background:var(--accent); color:#fff; }
.chip.warn { background:var(--down); }
details { background:var(--card); border:1px solid var(--border); border-radius:12px;
  padding:10px 14px; margin:8px 0; box-shadow:var(--shadow); }
details summary { cursor:pointer; display:flex; gap:10px; align-items:center; }
details ul { margin:10px 0 2px; }
.dev { background:var(--card); border:1px solid var(--border); border-radius:14px;
  padding:14px 16px; margin:10px 0; box-shadow:var(--shadow); border-left:3px solid var(--accent); }
.dev-head { display:flex; gap:10px; align-items:center; font-size:.82rem; margin-bottom:6px; }
.dev-title { margin:2px 0 6px; font-size:1rem; }
.dev-summary { margin:0; color:var(--fg); opacity:.9; }
.concerns { display:flex; flex-direction:column; gap:10px; }
.concern { background:var(--down-bg); border:1px solid var(--border); border-left:3px solid var(--down);
  border-radius:12px; padding:10px 14px; }
.concern ul { margin:8px 0 2px; }
.disclaimer-line { font-size:.82rem; margin:0 0 12px; }
.stance-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px; }
.stance-card { background:var(--card); border:1px solid var(--border); border-radius:16px;
  padding:16px; box-shadow:var(--shadow); }
.stance-top { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.stance-sector { font-size:.78rem; }
.stance-chg { margin-left:auto; font-weight:700; }
.badge { font-size:.75rem; font-weight:700; padding:3px 10px; border-radius:999px;
  text-transform:uppercase; letter-spacing:.03em; }
.badge.st-good { background:var(--up-bg); color:var(--up); }
.badge.st-watch { background:var(--warn-bg); color:var(--warn); }
.badge.st-neutral { background:var(--card-2); color:var(--muted); border:1px solid var(--border); }
.badge.st-warn { background:var(--down-bg); color:var(--down); }
.stance-lean { font-weight:600; margin:12px 0 4px; }
.stance-note { margin:0 0 12px; color:var(--fg); opacity:.9; font-size:.92rem; }
.stance-news { border-top:1px dashed var(--border); padding-top:10px; }
.stance-news-k { font-size:.72rem; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); margin-bottom:2px; }
.stance-news-t { font-size:.92rem; }
a { color:var(--accent-ink); text-decoration:none; }
a:hover { text-decoration:underline; }
.sources { font-size:.9rem; }
footer { margin-top:44px; padding:14px 16px; background:var(--card); border:1px solid var(--border);
  border-radius:12px; color:var(--muted); font-size:.82rem; box-shadow:var(--shadow); }
"""


def build_html(ranked: list[dict], news_by_symbol: Optional[dict] = None,
               as_of: Optional[str] = None, indices: Optional[dict] = None,
               history_by_symbol: Optional[dict] = None,
               stances: Optional[list] = None,
               stance_disclaimer: str = "",
               earnings: Optional[dict] = None) -> str:
    """Render the full standalone HTML briefing page."""
    as_of = as_of or date.today().isoformat()

    stance_block = ""
    if stances:
        stance_block = (
            "<h2>Daily read — your holdings</h2>"
            + _stance_section(stances, stance_disclaimer)
        )

    if ranked:
        movers = (
            '<div class="card"><table><thead><tr>'
            "<th>#</th><th>Ticker</th><th>Sector</th><th>Trend</th><th>Score</th>"
            "<th class='num'>Price</th><th class='num'>Chg%</th>"
            "<th class='num'>Vol×</th><th class='num'>RSI</th>"
            f"</tr></thead><tbody>{_movers_rows(ranked, history_by_symbol)}</tbody></table></div>"
        )
    else:
        movers = '<p class="muted">No data collected.</p>'

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
  <header class="hero">
    <h1>Daily Market Intelligence Briefing</h1>
    <p class="date">{_esc(as_of)}</p>
    {_stat_tiles(ranked)}
  </header>

  <h2>Market snapshot</h2>
  {_index_tiles(indices)}

  {stance_block}

  <h2>Top movers &amp; bullish candidates</h2>
  {movers}
  <h3>Why they scored</h3>
  {_why_blocks(ranked)}

  <h2>Earnings roundup</h2>
  {_earnings_section(earnings)}

  <h2>Notable developments</h2>
  {_developments(news_by_symbol)}

  <h2>Watch list &amp; concerns</h2>
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
