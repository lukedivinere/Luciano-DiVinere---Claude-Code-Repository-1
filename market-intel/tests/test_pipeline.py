"""End-to-end pipeline test with injected fake collectors. No network."""

import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pipeline  # noqa: E402


def _fake_prices(symbols):
    # NVDA collects fine; BAD fails — exercise the error path.
    snaps = {
        "NVDA": {
            "symbol": "NVDA", "as_of": "2024-06-03T20:00:00+00:00",
            "current_price": 1150.0, "prev_close": 1100.0, "change_pct": 4.55,
            "volume": 50_000_000, "avg_volume": 26_000_000, "volume_ratio": 1.92,
            "ma_short": 1080.0, "ma_long": 950.0, "rsi": 66.0,
        },
    }
    return {"snapshots": snaps, "errors": {"BAD": "boom"}}


def _fake_news(symbol):
    if symbol == "NVDA":
        return [{"title": "Nvidia beats earnings, raises guidance", "source": "Reuters",
                 "published_at": "2024-06-03", "url": "https://x/nvda", "relevance_score": 14}]
    return []


def test_pipeline_end_to_end():
    with tempfile.TemporaryDirectory() as d:
        db = os.path.join(d, "t.db")
        reports = os.path.join(d, "reports")
        result = pipeline.run(
            ["NVDA", "BAD"],
            db_path=db,
            report_dir=reports,
            collect_prices=_fake_prices,
            collect_news=_fake_news,
            as_of="2024-06-03",
        )

        assert result["collected"] == 1
        assert result["errors"] == {"BAD": "boom"}
        assert result["ranked"][0]["symbol"] == "NVDA"
        # Report written and readable.
        assert os.path.isfile(result["report_path"])
        with open(result["report_path"], encoding="utf-8") as f:
            md = f.read()
        assert "NVDA" in md and "NOT investment advice" in md


def test_pipeline_persists_across_runs():
    with tempfile.TemporaryDirectory() as d:
        db = os.path.join(d, "t.db")
        # Day 1
        pipeline.run(["NVDA"], db_path=db, report_dir=d,
                     collect_prices=_fake_prices, collect_news=_fake_news,
                     as_of="2024-06-03", write_report=False)
        # Day 2: no fresh collection (simulate outage) — ranking still works
        # off the stored snapshot.
        result = pipeline.run(
            ["NVDA"], db_path=db, report_dir=d,
            collect_prices=lambda syms: {"snapshots": {}, "errors": {"NVDA": "outage"}},
            collect_news=lambda s: [],
            as_of="2024-06-04", write_report=False,
        )
        assert result["collected"] == 0
        assert result["errors"] == {"NVDA": "outage"}
        # Prior day's NVDA snapshot is still ranked.
        assert any(r["symbol"] == "NVDA" for r in result["ranked"])


if __name__ == "__main__":
    passed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
            passed += 1
    print(f"\n{passed} test(s) passed.")
