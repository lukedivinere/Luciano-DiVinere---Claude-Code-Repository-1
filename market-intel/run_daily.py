"""Scheduled entrypoint: run the pipeline once and deliver the briefing.

Invoked by cron or the GitHub Actions workflow. Thin wrapper over
pipeline.run + delivery.deliver so scheduling stays declarative.

Usage:
    python run_daily.py                      # console + write file
    python run_daily.py --method email       # also email (needs SMTP env)
    python run_daily.py --symbols AAPL MSFT   # override the universe
"""

from __future__ import annotations

import argparse

import delivery
import pipeline


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run the daily market intelligence briefing.")
    parser.add_argument("--symbols", nargs="*", default=None,
                        help="Tickers to scan (default: config.TICKERS).")
    parser.add_argument("--method", choices=["console", "email"], default="console",
                        help="Delivery channel (report file is always written).")
    parser.add_argument("--report-dir", default="reports")
    args = parser.parse_args(argv)

    result = pipeline.run(args.symbols, report_dir=args.report_dir)

    print(
        f"[run_daily] {result['as_of']}: {result['collected']} collected, "
        f"{len(result['errors'])} error(s); report -> {result['report_path']}"
    )

    outcome = delivery.deliver(result["markdown"], method=args.method,
                               subject=f"Market Briefing — {result['as_of']}")
    print(f"[run_daily] delivery: {outcome}")

    # Succeed if we produced a briefing from at least one ranked symbol.
    return 0 if result["ranked"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
