"""US market-session helper (pure, timezone-aware).

Classifies a moment into pre-market / open / after-hours / closed using
US Eastern time with proper DST handling. Used to stamp the briefing with
how fresh it is and which session the extended-hours prices come from.
"""

from __future__ import annotations

from datetime import datetime, time, timezone
from typing import Optional
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")

# US equity sessions (Eastern):
PRE_OPEN = time(4, 0)
REG_OPEN = time(9, 30)
REG_CLOSE = time(16, 0)
POST_CLOSE = time(20, 0)

LABEL = {
    "pre-market": "Pre-market",
    "open": "Market open",
    "after-hours": "After hours",
    "closed": "Market closed",
}


def session_for(dt_utc: Optional[datetime] = None) -> str:
    """Return the session key for a UTC datetime (defaults to now)."""
    dt_utc = dt_utc or datetime.now(timezone.utc)
    if dt_utc.tzinfo is None:
        dt_utc = dt_utc.replace(tzinfo=timezone.utc)
    et = dt_utc.astimezone(ET)

    if et.weekday() >= 5:            # Saturday/Sunday
        return "closed"

    t = et.time()
    if PRE_OPEN <= t < REG_OPEN:
        return "pre-market"
    if REG_OPEN <= t < REG_CLOSE:
        return "open"
    if REG_CLOSE <= t < POST_CLOSE:
        return "after-hours"
    return "closed"


def label_for(dt_utc: Optional[datetime] = None) -> str:
    """Human label for the current session, e.g. 'After hours'."""
    return LABEL[session_for(dt_utc)]


def is_extended(session: str) -> bool:
    """True during pre-market or after-hours (when extended prices matter)."""
    return session in ("pre-market", "after-hours")
