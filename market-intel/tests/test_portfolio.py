"""Tests for the portfolio P&L engine. Pure math, no network, no secrets."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import portfolio  # noqa: E402

HOLDINGS = {
    "cash": 100.0,
    "positions": {
        "NVDA": {"qty": 3, "cost": 200.0},
        "PLTR": {"qty": 8, "cost": 150.0},
    },
}
PRICES = {
    "NVDA": {"current_price": 214.0, "prev_close": 212.0},
    "PLTR": {"current_price": 172.0, "prev_close": 173.0},
}


def test_parse_handles_json_string_and_dict():
    import json
    a = portfolio.parse_portfolio(HOLDINGS)
    b = portfolio.parse_portfolio(json.dumps(HOLDINGS))
    assert a == b
    assert a["cash"] == 100.0 and "NVDA" in a["positions"]


def test_parse_bad_input_is_safe():
    assert portfolio.parse_portfolio("not json") == {"positions": {}, "cash": 0.0}
    assert portfolio.parse_portfolio(None) == {"positions": {}, "cash": 0.0}


def test_compute_position_gain():
    out = portfolio.compute(HOLDINGS, PRICES)
    nvda = next(r for r in out["rows"] if r["symbol"] == "NVDA")
    assert nvda["value"] == round(3 * 214.0, 2)
    assert nvda["basis"] == round(3 * 200.0, 2)
    assert nvda["gain"] == round(3 * (214.0 - 200.0), 2)
    assert nvda["day_change"] == round(3 * (214.0 - 212.0), 2)


def test_compute_totals_and_cash():
    out = portfolio.compute(HOLDINGS, PRICES)
    exp_value = 3 * 214.0 + 8 * 172.0
    exp_basis = 3 * 200.0 + 8 * 150.0
    assert out["positions_value"] == round(exp_value, 2)
    assert out["total_assets"] == round(exp_value + 100.0, 2)   # includes cash
    assert out["total_gain"] == round(exp_value - exp_basis, 2)
    # Rows sorted by value, biggest first.
    assert out["rows"][0]["value"] >= out["rows"][1]["value"]


def test_missing_price_excluded_from_totals():
    prices = {"NVDA": {"current_price": 214.0, "prev_close": 212.0}}  # no PLTR
    out = portfolio.compute(HOLDINGS, prices)
    pltr = next(r for r in out["rows"] if r["symbol"] == "PLTR")
    assert pltr["status"] == "no-price"
    # Only NVDA counts toward value.
    assert out["positions_value"] == round(3 * 214.0, 2)


def test_from_env_reads_secret(monkeypatch=None):
    import json
    os.environ["PORTFOLIO_JSON"] = json.dumps(HOLDINGS)
    try:
        p = portfolio.from_env()
        assert p["cash"] == 100.0
        assert portfolio.has_holdings(p)
    finally:
        del os.environ["PORTFOLIO_JSON"]
    assert not portfolio.has_holdings(None)


if __name__ == "__main__":
    passed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
            passed += 1
    print(f"\n{passed} test(s) passed.")
