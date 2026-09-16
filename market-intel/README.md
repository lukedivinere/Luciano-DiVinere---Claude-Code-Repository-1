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
- [ ] Step 3 — Normalizer / store (SQLite)
- [ ] Step 4 — Ranking / scoring
- [ ] Step 5 — Report generator (Markdown)
- [ ] Step 6 — Delivery (email / Slack)
- [ ] Step 7 — Scheduling (cron / GitHub Actions)

## Layout

```
market-intel/
├── config.py            # tickers, sectors, indicator windows (non-secret)
├── .env.example         # API keys template (copy to .env; gitignored)
├── requirements.txt
├── collectors/
│   ├── __init__.py
│   └── prices.py        # price/volume + technicals collector
└── tests/
    └── test_prices.py   # offline isolation tests for the collector
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
