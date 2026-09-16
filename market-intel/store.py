"""SQLite normalizer / store (build plan step 3).

Persists collector output so the agent can track trends day over day.
Two tables:

  price_snapshots  — one row per (symbol, trade_date); re-running a day
                     upserts rather than duplicating.
  news_items       — deduped by (symbol, title, published_at).

Design notes:
  - Snapshots are tagged with sector (from config.SECTORS) at write time so
    later ranking/report layers can group without a second lookup.
  - `trade_date` (the as_of date) is the dedupe key, not the wall-clock
    insert time, so two runs on the same market day collapse to one row.
  - Everything is parameterized SQL (no string interpolation of values).
"""

from __future__ import annotations

import os
import sqlite3
from typing import Iterable, Optional

import config

DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "market_intel.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS price_snapshots (
    symbol        TEXT NOT NULL,
    trade_date    TEXT NOT NULL,      -- YYYY-MM-DD derived from as_of
    as_of         TEXT NOT NULL,      -- full ISO timestamp of collection
    sector        TEXT,
    current_price REAL NOT NULL,
    prev_close    REAL NOT NULL,
    change_pct    REAL NOT NULL,
    volume        INTEGER NOT NULL,
    avg_volume    INTEGER NOT NULL,
    volume_ratio  REAL NOT NULL,
    ma_short      REAL NOT NULL,
    ma_long       REAL NOT NULL,
    rsi           REAL NOT NULL,
    PRIMARY KEY (symbol, trade_date)
);

CREATE TABLE IF NOT EXISTS news_items (
    symbol          TEXT NOT NULL,
    title           TEXT NOT NULL,
    source          TEXT,
    published_at    TEXT,
    url             TEXT,
    relevance_score INTEGER,
    collected_date  TEXT NOT NULL,
    PRIMARY KEY (symbol, title, published_at)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_symbol_date
    ON price_snapshots (symbol, trade_date);
"""


def connect(db_path: str = DEFAULT_DB_PATH) -> sqlite3.Connection:
    """Open (and initialize) the database. Rows come back as dict-like."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    return conn


def _trade_date(as_of: str) -> str:
    """Derive the YYYY-MM-DD trade date from an ISO timestamp."""
    return (as_of or "")[:10]


def upsert_price_snapshots(conn: sqlite3.Connection, snapshots: Iterable[dict]) -> int:
    """Insert or replace price snapshots. Returns the number written.

    `snapshots` is an iterable of PriceSnapshot dicts (as produced by
    collectors.prices). Sector is filled from config.SECTORS.
    """
    rows = []
    for s in snapshots:
        rows.append((
            s["symbol"],
            _trade_date(s["as_of"]),
            s["as_of"],
            config.SECTORS.get(s["symbol"]),
            s["current_price"],
            s["prev_close"],
            s["change_pct"],
            s["volume"],
            s["avg_volume"],
            s["volume_ratio"],
            s["ma_short"],
            s["ma_long"],
            s["rsi"],
        ))

    conn.executemany(
        """
        INSERT INTO price_snapshots (
            symbol, trade_date, as_of, sector, current_price, prev_close,
            change_pct, volume, avg_volume, volume_ratio, ma_short, ma_long, rsi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(symbol, trade_date) DO UPDATE SET
            as_of=excluded.as_of,
            sector=excluded.sector,
            current_price=excluded.current_price,
            prev_close=excluded.prev_close,
            change_pct=excluded.change_pct,
            volume=excluded.volume,
            avg_volume=excluded.avg_volume,
            volume_ratio=excluded.volume_ratio,
            ma_short=excluded.ma_short,
            ma_long=excluded.ma_long,
            rsi=excluded.rsi
        """,
        rows,
    )
    conn.commit()
    return len(rows)


def upsert_news(conn: sqlite3.Connection, symbol: str, items: Iterable[dict],
                collected_date: Optional[str] = None) -> int:
    """Insert or ignore news items (dedupe on symbol+title+published_at)."""
    from datetime import date

    collected_date = collected_date or date.today().isoformat()
    rows = [
        (
            symbol.upper(),
            it.get("title", ""),
            it.get("source"),
            it.get("published_at"),
            it.get("url"),
            it.get("relevance_score"),
            collected_date,
        )
        for it in items
    ]
    conn.executemany(
        """
        INSERT OR IGNORE INTO news_items (
            symbol, title, source, published_at, url, relevance_score, collected_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        rows,
    )
    conn.commit()
    return len(rows)


def price_history(conn: sqlite3.Connection, symbol: str, days: int = 30) -> list[dict]:
    """Return up to `days` most-recent snapshots for a symbol, oldest first."""
    cur = conn.execute(
        """
        SELECT * FROM price_snapshots
        WHERE symbol = ?
        ORDER BY trade_date DESC
        LIMIT ?
        """,
        (symbol.upper(), days),
    )
    rows = [dict(r) for r in cur.fetchall()]
    rows.reverse()  # chronological
    return rows


def latest_snapshots(conn: sqlite3.Connection) -> list[dict]:
    """Return the most recent snapshot for each symbol."""
    cur = conn.execute(
        """
        SELECT s.* FROM price_snapshots s
        JOIN (
            SELECT symbol, MAX(trade_date) AS md
            FROM price_snapshots GROUP BY symbol
        ) latest ON s.symbol = latest.symbol AND s.trade_date = latest.md
        ORDER BY s.symbol
        """
    )
    return [dict(r) for r in cur.fetchall()]
