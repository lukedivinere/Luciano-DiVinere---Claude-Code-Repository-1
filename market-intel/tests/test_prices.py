"""Isolation tests for the price collector.

These do NOT hit the network. yfinance's Ticker.history is monkeypatched
with a synthetic price series so the pure computation (change %, MAs,
volume ratio, RSI) is verified deterministically.

Run from the market-intel/ directory:
    python -m pytest tests/ -q
or without pytest installed:
    python tests/test_prices.py
"""

import os
import sys

import pandas as pd

# Make `config` and `collectors` importable when run from anywhere.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from collectors import prices  # noqa: E402


def _fake_history(n=60, start=100.0, step=1.0, volume=1_000_000):
    """A steadily rising close series with constant volume."""
    closes = [start + i * step for i in range(n)]
    idx = pd.date_range("2024-01-01", periods=n, freq="D")
    return pd.DataFrame({"Close": closes, "Volume": [volume] * n}, index=idx)


class _FakeTicker:
    def __init__(self, df):
        self._df = df

    def history(self, period=None):
        return self._df


def _patch(monkeypatch_df):
    """Return a collect() bound to a fake yfinance Ticker."""
    original = prices.yf.Ticker
    prices.yf.Ticker = lambda symbol: _FakeTicker(monkeypatch_df)
    return original


def test_collect_rising_series():
    original = _patch(_fake_history())
    try:
        snap = prices.collect("test")
    finally:
        prices.yf.Ticker = original

    # Last close = 100 + 59*1 = 159; prev = 158.
    assert snap.current_price == 159.0
    assert snap.prev_close == 158.0
    assert round(snap.change_pct, 2) == round((159 - 158) / 158 * 100, 2)

    # In a monotonic uptrend, short MA sits above long MA and price above both.
    assert snap.ma_short > snap.ma_long
    assert snap.current_price > snap.ma_short

    # Constant volume => today's volume equals its own rolling average.
    assert snap.volume_ratio == 1.0

    # RSI of a strict uptrend (no down days) is 100.
    assert snap.rsi == 100.0


def test_insufficient_history_raises():
    original = _patch(_fake_history(n=5))
    try:
        raised = False
        try:
            prices.collect("short")
        except ValueError:
            raised = True
    finally:
        prices.yf.Ticker = original
    assert raised, "expected ValueError on too-short history"


def test_collect_many_isolates_failures():
    # One good ticker, one that raises inside collect().
    original = prices.collect

    def fake_collect(sym):
        if sym.upper() == "BAD":
            raise ValueError("boom")
        return original.__wrapped__(sym) if hasattr(original, "__wrapped__") else _good_snapshot(sym)

    def _good_snapshot(sym):
        return prices.PriceSnapshot(
            symbol=sym.upper(), as_of="2024-01-01T00:00:00+00:00",
            current_price=1.0, prev_close=1.0, change_pct=0.0,
            volume=1, avg_volume=1, volume_ratio=1.0,
            ma_short=1.0, ma_long=1.0, rsi=50.0,
        )

    prices.collect = fake_collect
    try:
        result = prices.collect_many(["GOOD", "BAD"])
    finally:
        prices.collect = original

    assert "GOOD" in result["snapshots"]
    assert "BAD" in result["errors"]
    assert result["errors"]["BAD"] == "boom"


if __name__ == "__main__":
    passed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
            passed += 1
    print(f"\n{passed} test(s) passed.")
