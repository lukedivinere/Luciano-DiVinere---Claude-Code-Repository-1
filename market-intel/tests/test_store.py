"""Tests for the SQLite store. Uses an in-memory DB — no files, no network."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import store  # noqa: E402


def _snap(symbol, as_of, price, volume=1_000_000, rsi=55.0):
    return {
        "symbol": symbol, "as_of": as_of, "current_price": price,
        "prev_close": price - 1, "change_pct": 1.0, "volume": volume,
        "avg_volume": volume, "volume_ratio": 1.0, "ma_short": price,
        "ma_long": price - 2, "rsi": rsi,
    }


def _mem_conn():
    return store.connect(":memory:")


def test_insert_and_read_back():
    conn = _mem_conn()
    n = store.upsert_price_snapshots(conn, [
        _snap("AAPL", "2024-01-02T12:00:00+00:00", 190.0),
        _snap("MSFT", "2024-01-02T12:00:00+00:00", 400.0),
    ])
    assert n == 2
    latest = store.latest_snapshots(conn)
    assert {r["symbol"] for r in latest} == {"AAPL", "MSFT"}
    # Sector tagging happens at write time.
    aapl = next(r for r in latest if r["symbol"] == "AAPL")
    assert aapl["sector"] == "Technology"


def test_same_day_upsert_dedupes():
    conn = _mem_conn()
    store.upsert_price_snapshots(conn, [_snap("AAPL", "2024-01-02T09:30:00+00:00", 190.0)])
    # Second run same trade date, different price -> update, not duplicate.
    store.upsert_price_snapshots(conn, [_snap("AAPL", "2024-01-02T16:00:00+00:00", 192.5)])

    hist = store.price_history(conn, "AAPL")
    assert len(hist) == 1
    assert hist[0]["current_price"] == 192.5
    assert hist[0]["as_of"] == "2024-01-02T16:00:00+00:00"


def test_history_is_chronological_and_bounded():
    conn = _mem_conn()
    for day in range(1, 6):  # 2024-01-01 .. 2024-01-05
        store.upsert_price_snapshots(
            conn, [_snap("AAPL", f"2024-01-0{day}T12:00:00+00:00", 100 + day)]
        )
    hist = store.price_history(conn, "AAPL", days=3)
    assert len(hist) == 3
    dates = [r["trade_date"] for r in hist]
    assert dates == sorted(dates)                 # chronological
    assert dates == ["2024-01-03", "2024-01-04", "2024-01-05"]  # most recent 3


def test_news_dedupe():
    conn = _mem_conn()
    items = [
        {"title": "NVDA beats on earnings", "source": "Reuters",
         "published_at": "2024-01-02", "url": "u1", "relevance_score": 11},
    ]
    store.upsert_news(conn, "NVDA", items, collected_date="2024-01-02")
    store.upsert_news(conn, "NVDA", items, collected_date="2024-01-03")  # same key
    cur = conn.execute("SELECT COUNT(*) AS c FROM news_items")
    assert cur.fetchone()["c"] == 1


if __name__ == "__main__":
    passed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
            passed += 1
    print(f"\n{passed} test(s) passed.")
