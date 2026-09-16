"""Market-index snapshot collector (fills report section 1).

Same yfinance mechanism as collectors.prices, but for the broad indices in
config.INDICES — a lightweight last-close vs. previous-close read, no
technicals. Feeds the report's "Market snapshot" section.

Reports observed levels only; no recommendations.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Optional

import yfinance as yf

import config


@dataclass
class IndexSnapshot:
    symbol: str
    name: str
    as_of: str
    level: float
    prev_close: float
    change_pct: float

    def as_dict(self) -> dict:
        return asdict(self)


def collect(symbol: str) -> IndexSnapshot:
    """Collect one index's latest level and daily change.

    Raises ValueError if fewer than two closes are available.
    """
    symbol = symbol.upper().strip()
    hist = yf.Ticker(symbol).history(period="5d")

    if hist.empty or len(hist) < 2:
        raise ValueError(f"Not enough data for index {symbol} (got {len(hist)} rows)")

    close = hist["Close"]
    level = float(close.iloc[-1])
    prev_close = float(close.iloc[-2])
    change_pct = (level - prev_close) / prev_close * 100

    return IndexSnapshot(
        symbol=symbol,
        name=config.INDICES.get(symbol, symbol),
        as_of=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        level=round(level, 2),
        prev_close=round(prev_close, 2),
        change_pct=round(change_pct, 2),
    )


def collect_indices(symbols: Optional[list[str]] = None) -> dict:
    """Collect all indices, isolating per-symbol failures."""
    symbols = symbols or list(config.INDICES.keys())
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

    result = collect_indices(argv or None)
    print(json.dumps(result, indent=2))
    print(f"\nCollected {len(result['snapshots'])} index/indices, "
          f"{len(result['errors'])} error(s).")
    return 0 if result["snapshots"] else 1


if __name__ == "__main__":
    import sys

    raise SystemExit(_main(sys.argv[1:]))
