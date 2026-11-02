"""Tests for the expected next-session move. No network — fetch is injected."""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from collectors import expected  # noqa: E402


def test_pick_atm_iv_averages_nearest_strike():
    calls = [{"strike": 90, "impliedVolatility": 0.50},
             {"strike": 100, "impliedVolatility": 0.40},   # ATM (price 101)
             {"strike": 110, "impliedVolatility": 0.45}]
    puts = [{"strike": 100, "impliedVolatility": 0.42},    # ATM
            {"strike": 110, "impliedVolatility": 0.48}]
    iv = expected.pick_atm_iv(calls, puts, price=101)
    assert iv == (0.40 + 0.42) / 2


def test_pick_atm_iv_skips_nan_and_bad():
    calls = [{"strike": 100, "impliedVolatility": float("nan")},
             {"strike": 100, "impliedVolatility": 0.30}]
    iv = expected.pick_atm_iv(calls, [], price=100)
    assert iv == 0.30                       # NaN skipped, call-only average


def test_implied_daily_move_scales_by_sqrt_252():
    move = expected.implied_daily_move(100.0, 0.40)
    assert math.isclose(move, 100.0 * 0.40 / math.sqrt(252), rel_tol=1e-9)
    assert expected.implied_daily_move(0, 0.4) is None
    assert expected.implied_daily_move(100, 0) is None


def test_daily_vol_needs_enough_data():
    assert expected.daily_vol_from_prices([100, 101]) is None
    vol = expected.daily_vol_from_prices([100, 102, 101, 103, 105, 104, 106])
    assert vol is not None and vol > 0


def test_expected_move_prefers_options():
    band = expected.expected_move_for(
        100.0, history=[100, 102, 101, 103, 105, 104],
        fetch=lambda price: {"iv": 0.40, "expiry": "2026-11-06"})
    assert band["source"] == "options"
    assert band["expiry"] == "2026-11-06"
    assert band["iv_pct"] == 40.0
    assert band["low"] < 100 < band["high"]
    assert band["move_pct"] > 0


def test_expected_move_falls_back_to_history():
    band = expected.expected_move_for(
        100.0, history=[100, 103, 98, 104, 96, 105, 95],
        fetch=lambda price: None)            # no options available
    assert band["source"] == "historical"
    assert band["iv_pct"] is None
    assert band["low"] < 100 < band["high"]


def test_expected_move_none_without_any_data():
    assert expected.expected_move_for(100.0, history=[100, 101],
                                      fetch=lambda p: None) is None
    assert expected.expected_move_for(None, history=[], fetch=None) is None


def test_get_expected_moves_resilient_and_filters():
    prices = {"NVDA": {"current_price": 100.0},
              "THIN": {"current_price": 10.0},
              "NOPX": {"current_price": None}}
    history = {"THIN": [10, 10.3, 9.8, 10.4, 9.6, 10.5, 9.5]}

    def make_fetch(sym):
        if sym == "NVDA":
            return lambda price: {"iv": 0.5, "expiry": "2026-11-06"}
        if sym == "THIN":
            return lambda price: None          # no options -> hist fallback
        return lambda price: (_ for _ in ()).throw(RuntimeError("boom"))

    out = expected.get_expected_moves(
        ["NVDA", "THIN", "NOPX"], prices, history, make_fetch=make_fetch)
    assert out["NVDA"]["source"] == "options"
    assert out["THIN"]["source"] == "historical"
    assert "NOPX" not in out                    # no price -> omitted


if __name__ == "__main__":
    passed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
            passed += 1
    print(f"\n{passed} test(s) passed.")
