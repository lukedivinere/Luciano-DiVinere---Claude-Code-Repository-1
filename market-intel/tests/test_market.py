"""Tests for the market-session helper. Pure, timezone-aware, no network."""

import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import market  # noqa: E402


def _utc(y, m, d, hh, mm=0):
    return datetime(y, m, d, hh, mm, tzinfo=timezone.utc)


def test_regular_session_weekday():
    # 2026-09-16 is a Wednesday. 15:00 UTC = 11:00 ET (EDT) -> open.
    assert market.session_for(_utc(2026, 9, 16, 15, 0)) == "open"


def test_pre_market():
    # 12:00 UTC = 08:00 ET -> pre-market.
    assert market.session_for(_utc(2026, 9, 16, 12, 0)) == "pre-market"


def test_after_hours():
    # 22:00 UTC = 18:00 ET -> after-hours.
    assert market.session_for(_utc(2026, 9, 16, 22, 0)) == "after-hours"


def test_overnight_closed():
    # 03:00 UTC = 23:00 ET (prev day) -> closed (before 4am ET pre-market).
    assert market.session_for(_utc(2026, 9, 16, 3, 0)) == "closed"


def test_weekend_closed():
    # 2026-09-19 is a Saturday, mid-day ET.
    assert market.session_for(_utc(2026, 9, 19, 16, 0)) == "closed"


def test_labels_and_is_extended():
    assert market.label_for(_utc(2026, 9, 16, 12, 0)) == "Pre-market"
    assert market.is_extended("pre-market") is True
    assert market.is_extended("after-hours") is True
    assert market.is_extended("open") is False
    assert market.is_extended("closed") is False


if __name__ == "__main__":
    passed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
            passed += 1
    print(f"\n{passed} test(s) passed.")
