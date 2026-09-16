"""Tests for the ranking screen. Pure logic, no network."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import ranking  # noqa: E402


def _snap(symbol, price, ma_short, ma_long, change_pct, volume_ratio, rsi, sector="Tech"):
    return {
        "symbol": symbol, "sector": sector, "current_price": price,
        "ma_short": ma_short, "ma_long": ma_long, "change_pct": change_pct,
        "volume_ratio": volume_ratio, "rsi": rsi,
    }


def test_strong_setup_scores_near_max():
    snap = _snap("NVDA", price=120, ma_short=110, ma_long=100,
                 change_pct=3.0, volume_ratio=2.0, rsi=62)
    rec = ranking.score_symbol(snap, news=[{"title": "beats earnings", "source": "Reuters",
                                            "relevance_score": 11}])
    # All six factors should trigger.
    assert rec["score"] == rec["max_score"]
    assert not rec["concerns"]


def test_weak_setup_flags_concerns():
    snap = _snap("INTC", price=90, ma_short=100, ma_long=110,
                 change_pct=-2.5, volume_ratio=0.8, rsi=40)
    rec = ranking.score_symbol(snap)
    assert rec["score"] == 0
    # Below-MA, no uptrend, down day, weak RSI -> several concerns.
    assert len(rec["concerns"]) >= 3


def test_overbought_is_a_concern_even_if_high_score():
    snap = _snap("TSLA", price=300, ma_short=280, ma_long=250,
                 change_pct=5.0, volume_ratio=3.0, rsi=82)
    rec = ranking.score_symbol(snap)
    assert any("overbought" in c.lower() for c in rec["concerns"])
    # RSI factor did NOT add points (82 is above healthy band).
    assert rec["score"] < rec["max_score"]


def test_rank_orders_by_score_desc():
    strong = _snap("A", 120, 110, 100, 3.0, 2.0, 62)
    weak = _snap("B", 90, 100, 110, -2.0, 0.5, 40)
    ranked = ranking.rank([weak, strong])
    assert [r["symbol"] for r in ranked] == ["A", "B"]


def test_news_catalyst_adds_points():
    snap = _snap("AAPL", 120, 110, 100, 3.0, 2.0, 62)
    without = ranking.score_symbol(snap)["score"]
    with_news = ranking.score_symbol(snap, news=[{"title": "x", "relevance_score": 9}])["score"]
    assert with_news == without + ranking.WEIGHTS["news_catalyst"]


if __name__ == "__main__":
    passed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
            passed += 1
    print(f"\n{passed} test(s) passed.")
