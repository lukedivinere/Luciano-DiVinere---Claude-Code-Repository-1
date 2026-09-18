"""End-to-end pipeline: collect -> store -> rank -> report -> (deliver).

This is the orchestrator the scheduler calls. Collectors are injectable so
the whole flow can be unit-tested offline with fakes; in production they
default to the real yfinance-backed collectors.

The pipeline is resilient: a ticker whose price fetch fails is skipped (the
collector already isolates that), and ranking runs off whatever made it into
the store — so a partial network outage still yields a briefing from the data
that was collected, plus any prior day's stored snapshots.
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Callable, Optional

import config
import market
import ranking
import report
import stance as stance_mod
import store
import webreport
from collectors import earnings as earnings_collector
from collectors import indices as index_collector
from collectors import news as news_collector
from collectors import prices as price_collector


def run(
    symbols: Optional[list[str]] = None,
    *,
    db_path: str = store.DEFAULT_DB_PATH,
    report_dir: str = "reports",
    collect_prices: Optional[Callable[[list[str]], dict]] = None,
    collect_news: Optional[Callable[[str], list]] = None,
    collect_indices: Optional[Callable[[], dict]] = None,
    collect_earnings: Optional[Callable[[list[str]], dict]] = None,
    as_of: Optional[str] = None,
    write_report: bool = True,
) -> dict:
    """Run one full cycle and return a result summary.

    Returns:
        {
          "as_of": str,
          "collected": int,          # snapshots collected this run
          "errors": {symbol: msg},   # tickers that failed to collect
          "ranked": [record, ...],   # ranked screen output
          "report_path": str | None,
          "markdown": str,
        }
    """
    symbols = symbols or config.TICKERS
    as_of = as_of or date.today().isoformat()
    collect_prices = collect_prices or price_collector.collect_many
    collect_news = collect_news or news_collector.get_news
    collect_indices = collect_indices or index_collector.collect_indices
    collect_earnings = collect_earnings or earnings_collector.get_earnings

    conn = store.connect(db_path)

    # 1. Collect + store prices.
    price_result = collect_prices(symbols)
    snapshots = price_result.get("snapshots", {})
    errors = price_result.get("errors", {})
    if snapshots:
        store.upsert_price_snapshots(conn, snapshots.values())

    # 2. Collect + store news for the symbols we actually have prices for.
    news_by_symbol: dict[str, list] = {}
    for sym in snapshots:
        items = collect_news(sym)
        if items:
            news_by_symbol[sym] = items
            store.upsert_news(conn, sym, items, collected_date=as_of)

    # 3. Market-index snapshot (best-effort; never blocks the briefing).
    index_snapshots = collect_indices().get("snapshots", {})

    # 4. Rank off the latest stored snapshots (includes prior days if any).
    ranked = ranking.rank(store.latest_snapshots(conn), news_by_symbol)

    # 4b. Pull each ranked symbol's price history for sparklines.
    history_by_symbol = {
        r["symbol"]: [row["current_price"]
                      for row in store.price_history(conn, r["symbol"], days=30)]
        for r in ranked
    }

    # 4c. Per-holding daily stance (rules-based signal, optional).
    stances = (stance_mod.build_stances(ranked, news_by_symbol)
               if getattr(config, "DAILY_STANCE_ENABLED", False) else None)

    # 4d. Earnings roundup (best-effort; empty without a Finnhub key).
    earnings = collect_earnings(symbols).get("by_symbol", {})

    # 4e. Extended-hours (pre/post market) per symbol + freshness stamp.
    extended_by_symbol = {
        sym: {"last_price": s.get("last_price"),
              "session": s.get("session"),
              "extended_change_pct": s.get("extended_change_pct")}
        for sym, s in snapshots.items()
    }
    updated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    current_session = market.session_for()
    session_label = market.LABEL[current_session]
    # Auto-refresh the open page only while the market is active (open or
    # extended hours); no point reloading overnight or on weekends.
    auto_refresh_secs = 300 if current_session != "closed" else 0

    # 5. Build (and optionally write) the report in both Markdown and HTML.
    markdown = report.build_report(ranked, news_by_symbol, as_of=as_of,
                                   indices=index_snapshots, earnings=earnings)
    html_page = webreport.build_html(ranked, news_by_symbol, as_of=as_of,
                                     indices=index_snapshots,
                                     history_by_symbol=history_by_symbol,
                                     stances=stances,
                                     stance_disclaimer=stance_mod.STANCE_DISCLAIMER,
                                     earnings=earnings,
                                     extended_by_symbol=extended_by_symbol,
                                     updated_at=updated_at,
                                     session_label=session_label,
                                     auto_refresh_secs=auto_refresh_secs)
    report_path = html_path = None
    if write_report:
        report_path = report.save_report(markdown, report_dir, as_of=as_of)
        html_path = webreport.save_html(html_page, report_dir, as_of=as_of)

    conn.close()

    return {
        "as_of": as_of,
        "collected": len(snapshots),
        "errors": errors,
        "ranked": ranked,
        "report_path": report_path,
        "html_path": html_path,
        "markdown": markdown,
        "html": html_page,
    }


def _main(argv: list[str]) -> int:
    symbols = argv or None
    result = run(symbols)
    print(result["markdown"])
    print(
        f"\n[pipeline] {result['collected']} collected, "
        f"{len(result['errors'])} error(s); report -> {result['report_path']}"
    )
    if result["errors"]:
        print("[pipeline] collection errors:")
        for sym, msg in result["errors"].items():
            print(f"  - {sym}: {msg}")
    # Non-zero only if nothing at all was collected AND the store was empty.
    return 0 if result["ranked"] else 1


if __name__ == "__main__":
    import sys

    raise SystemExit(_main(sys.argv[1:]))
