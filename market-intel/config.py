"""Central configuration for the Daily Stock Market Intelligence Agent.

Non-secret settings live here and are committed to the repo.
Secrets (API keys) live in a local `.env` file — see `.env.example`.

This is a research/aggregation tool. It never places trades; it only
collects, ranks, and reports. See README.md.
"""

import os

# --- Secrets (loaded from environment / .env; never hard-code keys here) ---
# The optional collectors that need keys read them lazily so that the core
# price collector works with zero configuration.
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
FINNHUB_API_KEY = os.environ.get("FINNHUB_API_KEY", "")

# --- Universe of interest ---------------------------------------------------
# Tickers the agent scans each run.
TICKERS = [
    "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA",
    "AMD", "AVGO", "NFLX", "CRM", "INTC", "PLTR", "MU",
]

# Optional sector grouping — used later by the ranking/report layers.
SECTORS = {
    "AAPL": "Technology",
    "MSFT": "Technology",
    "NVDA": "Semiconductors",
    "AMD": "Semiconductors",
    "AVGO": "Semiconductors",
    "INTC": "Semiconductors",
    "MU": "Semiconductors",
    "AMZN": "Consumer Discretionary",
    "TSLA": "Consumer Discretionary",
    "GOOGL": "Communication Services",
    "META": "Communication Services",
    "NFLX": "Communication Services",
    "CRM": "Software",
    "PLTR": "Software",
}

# Market indices for the report's snapshot section (Yahoo ^ symbols).
INDICES = {
    "^GSPC": "S&P 500",
    "^IXIC": "Nasdaq Composite",
    "^DJI": "Dow Jones",
    "^RUT": "Russell 2000",
    "^VIX": "Volatility (VIX)",
}

# --- Collector tuning -------------------------------------------------------
# How much history to pull for technicals, and the indicator windows.
PRICE_HISTORY_PERIOD = "3mo"   # yfinance period string
MA_SHORT_WINDOW = 20
MA_LONG_WINDOW = 50
VOLUME_AVG_WINDOW = 20
RSI_PERIOD = 14

# Minimum rows required before we trust the indicators (need > MA_LONG_WINDOW).
MIN_HISTORY_ROWS = MA_LONG_WINDOW
