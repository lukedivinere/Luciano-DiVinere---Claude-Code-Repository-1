"""Tests for the rules-based daily stance. Pure logic, no network."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import ranking  # noqa: E402
import stance  # noqa: E402


def _rec(price, ma_s, ma_l, chg, vr, rsi, news=None):
    snap = {"symbol": "X", "sector": "Tech", "current_price": price, "ma_short": ma_s,
            "ma_long": ma_l, "change_pct": chg, "volume_ratio": vr, "rsi": rsi}
    return ranking.score_symbol(snap, news)


def test_strong_setup_is_constructive():
    rec = _rec(120, 110, 100, 3.0, 2.0, 62,
               news=[{"title": "beats", "relevance_score": 11}])
    assert stance.classify(rec)["stance"] == "Constructive"


def test_overbought_is_cautious_extended():
    rec = _rec(300, 280, 250, 5.0, 3.0, 84)   # RSI 84 -> overbought concern
    v = stance.classify(rec)
    assert v["stance"] == "Cautious"
    assert "extended" in v["lean"].lower() or "overbought" in v["note"].lower()


def test_weak_is_cautious():
    rec = _rec(90, 100, 110, -2.5, 0.6, 40)
    assert stance.classify(rec)["stance"] == "Cautious"


def test_partial_is_watch():
    # Above short MA + up day + healthy RSI but no uptrend stack, no volume.
    rec = _rec(105, 100, 108, 1.0, 0.8, 55)
    assert stance.classify(rec)["stance"] in ("Watch", "Neutral")


def test_build_stance_attaches_top_news():
    rec = _rec(120, 110, 100, 3.0, 2.0, 62)
    news = [{"title": "small", "relevance_score": 6, "description": "minor"},
            {"title": "big beat", "relevance_score": 14, "description": "revenue beat"}]
    out = stance.build_stance(rec, news)
    assert out["news"]["title"] == "big beat"        # highest relevance chosen
    assert out["stance"] == "Constructive"
    assert out["symbol"] == "X"


def test_build_stances_keeps_order():
    strong = _rec(120, 110, 100, 3.0, 2.0, 62); strong["symbol"] = "A"
    weak = _rec(90, 100, 110, -2.0, 0.5, 40); weak["symbol"] = "B"
    out = stance.build_stances([strong, weak])
    assert [s["symbol"] for s in out] == ["A", "B"]


if __name__ == "__main__":
    passed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
            passed += 1
    print(f"\n{passed} test(s) passed.")
