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

from datetime import date
from typing import Callable, Optional

import config
import ranking
import report
import store
from collectors import news as news_collector
from collectors import prices as price_collector


def run(
    symbols: Optional[list[str]] = None,
    *,
    db_path: str = store.DEFAULT_DB_PATH,
    report_dir: str = "reports",
    collect_prices: Optional[Callable[[list[str]], dict]] = None,
    collect_news: Optional[Callable[[str], list]] = None,
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

    # 3. Rank off the latest stored snapshots (includes prior days if any).
    ranked = ranking.rank(store.latest_snapshots(conn), news_by_symbol)

    # 4. Build (and optionally write) the report.
    markdown = report.build_report(ranked, news_by_symbol, as_of=as_of)
    report_path = report.save_report(markdown, report_dir, as_of=as_of) if write_report else None

    conn.close()

    return {
        "as_of": as_of,
        "collected": len(snapshots),
        "errors": errors,
        "ranked": ranked,
        "report_path": report_path,
        "markdown": markdown,
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
