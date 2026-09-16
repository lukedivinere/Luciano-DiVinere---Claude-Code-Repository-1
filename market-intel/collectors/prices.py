"""Price / volume + technicals collector (yfinance).

The first data collector in the pipeline. Given a ticker, it returns a
flat dict of the day's price, volume, and a few standard technical
indicators (moving averages, average volume, RSI). Later layers
(ranking, report) consume this shape.

Adapted from the reference repo's `analyzer.get_stock_data`, but with:
  - configurable windows (from config.py),
  - explicit typed return + error handling,
  - a `collect_many` batch helper that never lets one bad ticker kill the run,
  - a CLI so it can be tested in isolation: `python -m collectors.prices AAPL MSFT`.

This module places no trades and makes no recommendations — it only
reports observed market data.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Optional

import pandas as pd
import yfinance as yf

import config


@dataclass
class PriceSnapshot:
    """A single ticker's price/volume picture for one collection run."""

    symbol: str
    as_of: str                 # UTC ISO timestamp of collection
    current_price: float
    prev_close: float
    change_pct: float          # % change vs. previous close
    volume: int
    avg_volume: int            # rolling average over VOLUME_AVG_WINDOW
    volume_ratio: float        # today's volume / avg_volume (unusual-volume flag)
    ma_short: float            # MA over MA_SHORT_WINDOW
    ma_long: float             # MA over MA_LONG_WINDOW
    rsi: float

    def as_dict(self) -> dict:
        return asdict(self)


def calculate_rsi(close: pd.Series, period: int = config.RSI_PERIOD) -> pd.Series:
    """Standard Wilder-style RSI on a close-price series."""
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.rolling(period).mean()
    avg_loss = loss.rolling(period).mean()

    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def collect(symbol: str) -> PriceSnapshot:
    """Collect price/volume + technicals for one ticker.

    Raises ValueError if there isn't enough history to compute indicators.
    """
    symbol = symbol.upper().strip()
    stock = yf.Ticker(symbol)
    hist = stock.history(period=config.PRICE_HISTORY_PERIOD)

    if hist.empty or len(hist) < config.MIN_HISTORY_ROWS:
        raise ValueError(
            f"Not enough historical data for {symbol} "
            f"(need >= {config.MIN_HISTORY_ROWS} rows, got {len(hist)})"
        )

    close = hist["Close"]
    volume = hist["Volume"]

    current_price = float(close.iloc[-1])
    prev_close = float(close.iloc[-2])
    change_pct = (current_price - prev_close) / prev_close * 100

    today_volume = int(volume.iloc[-1])
    avg_volume = int(volume.rolling(config.VOLUME_AVG_WINDOW).mean().iloc[-1])
    volume_ratio = today_volume / avg_volume if avg_volume else 0.0

    ma_short = float(close.rolling(config.MA_SHORT_WINDOW).mean().iloc[-1])
    ma_long = float(close.rolling(config.MA_LONG_WINDOW).mean().iloc[-1])
    rsi = float(calculate_rsi(close).iloc[-1])

    return PriceSnapshot(
        symbol=symbol,
        as_of=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        current_price=round(current_price, 2),
        prev_close=round(prev_close, 2),
        change_pct=round(change_pct, 2),
        volume=today_volume,
        avg_volume=avg_volume,
        volume_ratio=round(volume_ratio, 2),
        ma_short=round(ma_short, 2),
        ma_long=round(ma_long, 2),
        rsi=round(rsi, 2),
    )


def collect_many(symbols: Optional[list[str]] = None) -> dict[str, dict]:
    """Collect snapshots for many tickers.

    One failing ticker never aborts the batch: failures are recorded under
    an "errors" key so the caller can see what was skipped and why.
    """
    symbols = symbols or config.TICKERS
    snapshots: dict[str, dict] = {}
    errors: dict[str, str] = {}

    for sym in symbols:
        try:
            snapshots[sym.upper()] = collect(sym).as_dict()
        except Exception as exc:  # noqa: BLE001 - collector must be resilient
            errors[sym.upper()] = str(exc)

    return {"snapshots": snapshots, "errors": errors}


def _main(argv: list[str]) -> int:
    import json

    symbols = argv or config.TICKERS
    result = collect_many(symbols)

    print(json.dumps(result, indent=2))

    got = len(result["snapshots"])
    failed = len(result["errors"])
    print(f"\nCollected {got} snapshot(s), {failed} error(s).")
    return 0 if got else 1


if __name__ == "__main__":
    import sys

    raise SystemExit(_main(sys.argv[1:]))
