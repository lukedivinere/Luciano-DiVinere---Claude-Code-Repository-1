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


def test_developments_show_summary_text():
    long_desc = ("Moderna said its experimental cancer vaccine cut recurrence in a "
                 "mid-stage trial. The company plans a larger study next year. Shares "
                 "rose on the news as analysts raised price targets across the board.")
    news = {"MRNA": [{"title": "Moderna cancer vaccine data", "source": "Reuters",
                      "published_at": "2024-06-03", "url": "https://ex.com/mrna",
                      "description": long_desc, "relevance_score": 12}]}
    html = webreport.build_html(_ranked(), news, as_of="2024-06-03")
    assert "experimental cancer vaccine cut recurrence" in html   # summary rendered
    assert 'class="dev-summary"' in html


def test_summary_escapes_html():
    news = {"NVDA": [{"title": "ok", "source": "Reuters", "published_at": "2024-06-03",
                      "url": "https://ex.com/x", "description": "<img src=x onerror=alert(1)>",
                      "relevance_score": 12}]}
    html = webreport.build_html(_ranked(), news, as_of="2024-06-03")
    assert "<img src=x" not in html
    assert "&lt;img" in html


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


def test_sparkline_rendered_when_history_present():
    html = webreport.build_html(
        _ranked(), {}, as_of="2024-06-03",
        history_by_symbol={"NVDA": [100, 105, 103, 110, 120]},
    )
    assert "<svg" in html and "spark up" in html
    assert "<th>Trend</th>" in html


def test_no_sparkline_without_history():
    html = webreport.build_html(_ranked(), {}, as_of="2024-06-03")
    # Trend column still present, but the cell shows a dash, no svg.
    assert "<th>Trend</th>" in html
    assert "<svg" not in html


def test_stance_section_renders():
    import stance
    ranked = _ranked()
    stances = stance.build_stances(ranked, {})
    html = webreport.build_html(ranked, {}, as_of="2024-06-03", stances=stances,
                                stance_disclaimer=stance.STANCE_DISCLAIMER)
    assert "Daily read — your holdings" in html
    assert "not a recommendation to buy or sell" in html
    assert "stance-card" in html


def test_earnings_section_renders():
    earnings = {"NVDA": {"symbol": "NVDA", "date": "2026-08-27", "hour": "after close",
                         "status": "beat", "eps_actual": 0.68, "eps_estimate": 0.64,
                         "eps_surprise_pct": 6.3, "rev_actual": 30040000000,
                         "rev_estimate": 28700000000, "rev_surprise_pct": 4.7}}
    html = webreport.build_html(_ranked(), {}, as_of="2026-08-27", earnings=earnings)
    assert "Earnings roundup" in html
    assert ">Beat<" in html
    assert "$30.04B" in html            # revenue money-formatted
    assert "(+6.3%)" in html            # eps surprise shown


def test_freshness_and_after_hours():
    ext = {"NVDA": {"last_price": 122.5, "session": "after-hours",
                    "extended_change_pct": 2.1}}
    html = webreport.build_html(
        _ranked(), {}, as_of="2026-09-16",
        extended_by_symbol=ext, updated_at="2026-09-16 22:05 UTC",
        session_label="After hours",
    )
    assert "Updated 2026-09-16 22:05 UTC" in html
    assert "After hours" in html
    assert "<th class='num'>After hrs</th>" in html
    assert "▲ +2.1" in html            # extended move shown with arrow


def test_after_hours_hidden_during_regular_session():
    # In an open session the extended cell is a dash, not a move.
    ext = {"NVDA": {"last_price": 120.0, "session": "open", "extended_change_pct": 0.0}}
    html = webreport.build_html(_ranked(), {}, as_of="2026-09-16", extended_by_symbol=ext)
    assert "<th class='num'>After hrs</th>" in html


def test_auto_refresh_script_present_when_enabled():
    html = webreport.build_html(_ranked(), {}, as_of="2026-09-16",
                                updated_at="2026-09-16 15:00 UTC",
                                session_label="Market open", auto_refresh_secs=300)
    assert "location.reload()" in html           # reload script injected
    assert "300*1000" in html                     # 5-minute interval
    assert "auto-refresh 5m" in html              # visible badge


def test_no_auto_refresh_when_disabled():
    html = webreport.build_html(_ranked(), {}, as_of="2026-09-16",
                                session_label="Market closed", auto_refresh_secs=0)
    assert "location.reload()" not in html
    assert "auto-refresh" not in html


def test_portfolio_section_renders_dollars():
    import portfolio
    holdings = {"cash": 100.0, "positions": {"NVDA": {"qty": 3, "cost": 200.0}}}
    prices = {"NVDA": {"current_price": 214.0, "prev_close": 212.0}}
    pnl = portfolio.compute(holdings, prices)
    html = webreport.build_html(_ranked(), {}, as_of="2026-09-18", portfolio=pnl)
    assert "Your portfolio" in html
    assert "Account total" in html
    assert "$642.00" in html            # 3 x $214 position value
    assert "▲ +$42.00" in html          # gain 3 x (214-200)


def test_no_portfolio_section_without_data():
    html = webreport.build_html(_ranked(), {}, as_of="2026-09-18")
    assert "Your portfolio" not in html


def test_why_it_moved_rendered_in_stance():
    import stance
    ranked = _ranked()
    stances = stance.build_stances(ranked, {})
    html = webreport.build_html(
        ranked, {}, as_of="2026-09-21", stances=stances,
        stance_disclaimer=stance.STANCE_DISCLAIMER,
        explanations={"NVDA": "Up on a strong earnings beat and raised guidance."},
    )
    assert "Why it moved" in html
    assert "Up on a strong earnings beat and raised guidance." in html


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
