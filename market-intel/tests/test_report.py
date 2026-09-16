"""Tests for the Markdown report generator. No network, no files (except tmp)."""

import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import ranking  # noqa: E402
import report  # noqa: E402


def _sample_ranked():
    snaps = [
        {"symbol": "NVDA", "sector": "Semiconductors", "current_price": 120,
         "ma_short": 110, "ma_long": 100, "change_pct": 3.0, "volume_ratio": 2.0, "rsi": 62},
        {"symbol": "INTC", "sector": "Semiconductors", "current_price": 90,
         "ma_short": 100, "ma_long": 110, "change_pct": -2.5, "volume_ratio": 0.8, "rsi": 40},
    ]
    news = {"NVDA": [{"title": "NVDA beats earnings", "source": "Reuters",
                      "published_at": "2024-01-02", "url": "http://x/1", "relevance_score": 11}]}
    return ranking.rank(snaps, news), news


def test_report_has_all_sections_and_disclaimer():
    ranked, news = _sample_ranked()
    md = report.build_report(ranked, news, as_of="2024-01-02")
    for heading in [
        "# Daily Market Intelligence Briefing — 2024-01-02",
        "## 1. Market snapshot",
        "## 2. Top movers",
        "## 3. Earnings roundup",
        "## 4. Notable developments",
        "## 5. Watch list / concerns",
        "## 6. Sources",
    ]:
        assert heading in md, f"missing section: {heading}"
    assert "NOT investment advice" in md
    # Top mover appears in the table and its source link in Sources.
    assert "| 1 | NVDA " in md
    assert "http://x/1" in md
    # Concern from the weak name shows up.
    assert "INTC" in md


def test_empty_inputs_render_safely():
    md = report.build_report([], {}, as_of="2024-01-02")
    assert "No data collected." in md
    assert "NOT investment advice" in md


def test_save_report_writes_file():
    ranked, news = _sample_ranked()
    md = report.build_report(ranked, news, as_of="2024-01-02")
    with tempfile.TemporaryDirectory() as d:
        path = report.save_report(md, d, as_of="2024-01-02")
        assert os.path.basename(path) == "briefing_2024-01-02.md"
        with open(path, encoding="utf-8") as f:
            assert "Daily Market Intelligence Briefing" in f.read()


if __name__ == "__main__":
    passed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
            passed += 1
    print(f"\n{passed} test(s) passed.")
