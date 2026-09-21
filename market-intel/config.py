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
# The stocks / ETFs YOU hold (from your portfolio). Edit freely.
TICKERS = [
    # Individual stocks
    "NVDA", "PLTR", "HOOD", "UBER", "ACHR", "RKLB", "ENPH", "NNOX", "GLW",
    # ETFs / funds
    "AIQ", "DRAM", "IBIT", "QQQM", "ROBO", "SCHG", "SPYM", "XLF", "SOXL", "SOXQ",
]

# Sector / type grouping — used by the ranking/report layers to tag and group.
SECTORS = {
    "NVDA": "Semiconductors",
    "PLTR": "Software",
    "HOOD": "Financials",
    "UBER": "Consumer Discretionary",
    "ACHR": "Aerospace / eVTOL",
    "RKLB": "Aerospace / Space",
    "ENPH": "Clean Energy",
    "NNOX": "Healthcare / Imaging",
    "GLW": "Technology / Materials",
    "AIQ": "ETF · AI",
    "DRAM": "ETF · Memory chips",
    "IBIT": "ETF · Bitcoin",
    "QQQM": "ETF · Nasdaq 100",
    "ROBO": "ETF · Robotics",
    "SCHG": "ETF · Large-cap growth",
    "SPYM": "ETF · S&P 500",
    "XLF": "ETF · Financials",
    "SOXL": "ETF · Semiconductors (3x)",
    "SOXQ": "ETF · Semiconductors",
}

# Show a per-holding daily "stance" section (rules-based signal, not advice).
DAILY_STANCE_ENABLED = True

# Stance thresholds — fraction of the max screen score. Tune as you watch
# real output: raise to make "Constructive" harder to earn, lower to loosen.
STANCE_CONSTRUCTIVE_RATIO = 0.72   # >= this (and not below MA) -> Constructive
STANCE_WATCH_RATIO = 0.42          # >= this -> Watch (mixed but holding up)

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
