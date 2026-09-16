# Daily Stock Market Intelligence Agent

An automated agent that runs on a schedule and produces a daily briefing:
movers to watch, earnings, company developments, and concerns/risks.

**This is a research / aggregation tool, not a trading bot.** It never
places trades — it only collects, ranks, and reports.

## Status

Being built incrementally per the build plan (Section 6). Current progress:

- [x] **Step 1 — Scaffold**: repo layout, `config.py` (tickers/sectors),
      `.env.example` (API keys), `requirements.txt`.
- [x] **Step 2 — First collector**: `collectors/prices.py` — yfinance
      price/volume + technicals, tested in isolation (`tests/test_prices.py`).
- [x] **Step 3 — Normalizer / store**: `store.py` — SQLite persistence for
      price snapshots (sector-tagged, one row per trade day, upsert-deduped)
      and news items, for day-over-day trend tracking (`tests/test_store.py`).
- [x] **News collector**: `collectors/news.py` — yfinance headlines with a
      transparent keyword relevance score (`tests/test_news.py`).
- [x] **Step 4 — Ranking / scoring**: `ranking.py` — transparent weighted
      screen (momentum, trend stack, unusual volume, RSI band, news catalyst)
      with a per-symbol reason/concern breakdown (`tests/test_ranking.py`).
- [x] **Step 5 — Report generator**: `report.py` — Markdown daily briefing
      (snapshot, ranked movers + why, developments, concerns, sources,
      disclaimer); un-wired sections shown as explicit placeholders
      (`tests/test_report.py`).
- [x] **Step 6 — Delivery**: `delivery.py` — console / email (SMTP from env;
      safe dry-run when unconfigured) (`tests/test_delivery.py`).
- [x] **Step 7 — Scheduling**: `run_daily.py` entrypoint +
      `.github/workflows/daily-briefing.yml` (weekday cron, runs tests,
      generates + emails the briefing, uploads it as an artifact).
- [x] **Orchestration**: `pipeline.py` ties collect → store → rank → report
      with injectable collectors; resilient to partial outages
      (`tests/test_pipeline.py`).
- [x] **Index collector**: `collectors/indices.py` — market-index snapshot
      wired into report section 1 (`tests/test_indices.py`).
- [ ] Later — earnings collector (Finnhub) to fill report section 3

## Layout

```
market-intel/
├── config.py            # tickers, sectors, indicator windows (non-secret)
├── .env.example         # API keys template (copy to .env; gitignored)
├── requirements.txt
├── store.py             # SQLite normalizer/store (snapshots + news)
├── ranking.py           # transparent weighted screen (score + reasons)
├── report.py            # Markdown daily-briefing generator
├── delivery.py          # console / email delivery
├── pipeline.py          # collect -> store -> rank -> report orchestrator
├── run_daily.py         # scheduled entrypoint (cron / CI)
├── collectors/
│   ├── __init__.py
│   ├── prices.py        # price/volume + technicals collector
│   └── news.py          # news collector + relevance scoring
└── tests/
    ├── test_prices.py   # offline isolation tests for the price collector
    ├── test_store.py    # in-memory SQLite tests
    ├── test_news.py     # offline scoring/ranking tests
    ├── test_ranking.py  # ranking screen tests
    └── test_report.py   # report rendering tests
```

## Run the full offline test suite

```bash
cd market-intel
for t in prices store news ranking report pipeline delivery indices; do python tests/test_$t.py; done
```

## Run the whole thing (needs Yahoo access)

```bash
cd market-intel
python run_daily.py                    # console + writes reports/briefing_<date>.md
python run_daily.py --method email     # also email (set SMTP_* in .env)
python run_daily.py --symbols AAPL MSFT NVDA
```

## Setup

```bash
cd market-intel
python -m venv .venv && source .venv/bin/activate   # optional
pip install -r requirements.txt
cp .env.example .env    # only needed for later (LLM / paid sources)
```

## Using the price collector

Test it in isolation from the `market-intel/` directory:

```bash
# Live fetch (needs network) — defaults to config.TICKERS if no args:
python -m collectors.prices AAPL MSFT NVDA

# Offline unit tests (no network):
python -m pytest tests/ -q      # or: python tests/test_prices.py
```

Each snapshot looks like:

```json
{
  "symbol": "AAPL",
  "as_of": "2024-01-01T00:00:00+00:00",
  "current_price": 189.95,
  "prev_close": 188.63,
  "change_pct": 0.7,
  "volume": 42000000,
  "avg_volume": 55000000,
  "volume_ratio": 0.76,
  "ma_short": 185.2,
  "ma_long": 180.4,
  "rsi": 61.3
}
```

## Guardrails

This produces **informational content, not investment advice.** Rankings
added in later steps are a transparent, rules-based screen — not a
prediction of returns.
