"""Tests for the Finnhub earnings collector. No network — fetch is injected."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from collectors import earnings  # noqa: E402

# A payload shaped like Finnhub's /calendar/earnings response.
SAMPLE = {
    "earningsCalendar": [
        {"symbol": "NVDA", "date": "2026-08-27", "hour": "amc", "quarter": 2, "year": 2026,
         "epsActual": 0.68, "epsEstimate": 0.64, "revenueActual": 30040000000,
         "revenueEstimate": 28700000000},
        {"symbol": "HOOD", "date": "2026-08-01", "hour": "amc", "quarter": 2, "year": 2026,
         "epsActual": 0.18, "epsEstimate": 0.22, "revenueActual": 682000000,
         "revenueEstimate": 700000000},
        {"symbol": "PLTR", "date": "2026-11-04", "hour": "amc", "quarter": 3, "year": 2026,
         "epsActual": None, "epsEstimate": 0.10, "revenueActual": None,
         "revenueEstimate": 800000000},
        {"symbol": "ZZZZ", "date": "2026-08-27", "hour": "bmo", "quarter": 2, "year": 2026,
         "epsActual": 1.0, "epsEstimate": 1.0, "revenueActual": 1, "revenueEstimate": 1},
    ]
}


def test_normalize_beat_and_surprise():
    rec = earnings.normalize_record(SAMPLE["earningsCalendar"][0])
    assert rec["symbol"] == "NVDA"
    assert rec["status"] == "beat"
    assert rec["eps_surprise_pct"] == round((0.68 - 0.64) / 0.64 * 100, 1)
    assert rec["hour"] == "after close"


def test_normalize_miss_and_upcoming():
    miss = earnings.normalize_record(SAMPLE["earningsCalendar"][1])
    assert miss["status"] == "miss"
    upcoming = earnings.normalize_record(SAMPLE["earningsCalendar"][2])
    assert upcoming["status"] == "upcoming"
    assert upcoming["eps_actual"] is None
    assert upcoming["eps_surprise_pct"] is None   # no divide by None


def test_parse_calendar_filters_to_symbols():
    by = earnings.parse_calendar(SAMPLE, ["NVDA", "HOOD", "PLTR"])
    assert set(by) == {"NVDA", "HOOD", "PLTR"}
    assert "ZZZZ" not in by                        # not in our universe


def test_get_earnings_no_key_is_noop():
    out = earnings.get_earnings(["NVDA"], api_key="")
    assert out == {"by_symbol": {}, "error": None}


def test_get_earnings_with_injected_fetch():
    captured = {}

    def fake_fetch(url):
        captured["url"] = url
        return SAMPLE

    out = earnings.get_earnings(["NVDA", "HOOD"], api_key="demo", fetch=fake_fetch)
    assert out["error"] is None
    assert out["by_symbol"]["NVDA"]["status"] == "beat"
    assert "token=demo" in captured["url"]


def test_get_earnings_isolates_fetch_error():
    def boom(url):
        raise RuntimeError("429 rate limited")
    out = earnings.get_earnings(["NVDA"], api_key="demo", fetch=boom)
    assert out["by_symbol"] == {}
    assert "429" in out["error"]


if __name__ == "__main__":
    passed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
            passed += 1
    print(f"\n{passed} test(s) passed.")
