"""Tests for the HTML briefing renderer, including HTML-injection safety."""

import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import ranking  # noqa: E402
import webreport  # noqa: E402


def _ranked():
    snaps = [{"symbol": "NVDA", "sector": "Semiconductors", "current_price": 120,
              "ma_short": 110, "ma_long": 100, "change_pct": 3.0,
              "volume_ratio": 2.0, "rsi": 62}]
    return ranking.rank(snaps, {})


def test_html_has_structure_and_disclaimer():
    html = webreport.build_html(_ranked(), {}, as_of="2024-06-03",
                                indices={"^GSPC": {"name": "S&P 500", "level": 5050.0,
                                                   "change_pct": 1.0}})
    assert html.startswith("<!doctype html>")
    assert "<title>Market Briefing — 2024-06-03</title>" in html
    assert "NVDA" in html
    assert "S&amp;P 500" in html                 # ampersand escaped
    assert "NOT investment advice" in html
    assert "prefers-color-scheme" in html        # dark mode support


def test_malicious_news_title_is_escaped():
    evil = {"NVDA": [{"title": "<script>alert('x')</script> beats earnings",
                      "source": "<b>Reuters</b>", "published_at": "2024-06-03",
                      "url": "javascript:alert(1)", "relevance_score": 11}]}
    html = webreport.build_html(_ranked(), evil, as_of="2024-06-03")
    # Raw script tag must NOT appear; escaped form must.
    assert "<script>alert" not in html
    assert "&lt;script&gt;" in html
    # javascript: URL must not become an href.
    assert 'href="javascript:' not in html
    assert "javascript:alert(1)" not in html     # dropped entirely, not linked


def test_safe_http_url_becomes_link():
    news = {"NVDA": [{"title": "beats earnings", "source": "Reuters",
                      "published_at": "2024-06-03", "url": "https://ex.com/a",
                      "relevance_score": 11}]}
    html = webreport.build_html(_ranked(), news, as_of="2024-06-03")
    assert 'href="https://ex.com/a"' in html


def test_save_html_writes_index_too():
    html = webreport.build_html(_ranked(), {}, as_of="2024-06-03")
    with tempfile.TemporaryDirectory() as d:
        path = webreport.save_html(html, d, as_of="2024-06-03")
        assert os.path.basename(path) == "briefing_2024-06-03.html"
        assert os.path.isfile(os.path.join(d, "index.html"))


def test_empty_renders_safely():
    html = webreport.build_html([], {}, as_of="2024-06-03")
    assert "No data collected." in html
    assert "NOT investment advice" in html


if __name__ == "__main__":
    passed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
            passed += 1
    print(f"\n{passed} test(s) passed.")
