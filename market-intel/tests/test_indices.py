"""Tests for the market-index collector. Monkeypatches yfinance — no network."""

import os
import sys

import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from collectors import indices  # noqa: E402


class _FakeTicker:
    def __init__(self, df):
        self._df = df

    def history(self, period=None):
        return self._df


def _df(closes):
    idx = pd.date_range("2024-01-01", periods=len(closes), freq="D")
    return pd.DataFrame({"Close": closes}, index=idx)


def test_collect_computes_change():
    original = indices.yf.Ticker
    indices.yf.Ticker = lambda s: _FakeTicker(_df([5000.0, 5050.0]))
    try:
        snap = indices.collect("^GSPC")
    finally:
        indices.yf.Ticker = original

    assert snap.symbol == "^GSPC"
    assert snap.name == "S&P 500"
    assert snap.level == 5050.0
    assert snap.prev_close == 5000.0
    assert snap.change_pct == 1.0


def test_insufficient_data_raises():
    original = indices.yf.Ticker
    indices.yf.Ticker = lambda s: _FakeTicker(_df([5000.0]))
    try:
        raised = False
        try:
            indices.collect("^GSPC")
        except ValueError:
            raised = True
    finally:
        indices.yf.Ticker = original
    assert raised


def test_collect_indices_isolates_failures():
    original = indices.collect

    def fake(sym):
        if sym.upper() == "^BAD":
            raise ValueError("no data")
        return indices.IndexSnapshot(sym.upper(), "X", "2024-01-01T00:00:00+00:00",
                                     100.0, 99.0, 1.01)

    indices.collect = fake
    try:
        result = indices.collect_indices(["^GSPC", "^BAD"])
    finally:
        indices.collect = original

    assert "^GSPC" in result["snapshots"]
    assert result["errors"]["^BAD"] == "no data"


if __name__ == "__main__":
    passed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
            passed += 1
    print(f"\n{passed} test(s) passed.")
