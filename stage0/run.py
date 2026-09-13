#!/usr/bin/env python3
"""
Stage 0 validation harness — does pitch-robust fingerprinting survive real club audio?

This is a THROWAWAY measurement tool, not app code. It answers one question with numbers:
when you record a track on your phone through a speaker (with noise, with the DJ's pitch
pushed up), does Panako still recognise it — and does it correctly stay SILENT on tracks it
has never seen?

It does three things:
  1. INDEX   — teach Panako your 10 source tracks (`panako store`).
  2. QUERY   — run each phone recording through `panako query` and also (optionally) AudD,
               the commercial catalog matcher, on the *same* audio.
  3. REPORT  — a table (per condition: attempts / correct / false / no-match) plus a CSV of
               every raw score, so you can see the score distribution of true vs false
               matches. That distribution is the real deliverable — it's what the merge
               thresholds in the next stage get calibrated from.

Run `python run.py --help`. Read the README first — you provide the audio.
"""

from __future__ import annotations

import argparse
import csv
import os
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
SOURCES = HERE / "sources"        # your 10 clean studio tracks go here
RECORDINGS = HERE / "recordings"  # your phone recordings go here
MANIFEST = HERE / "manifest.csv"  # ground truth: which recording is which track, condition
SCORES_CSV = HERE / "scores.csv"  # every raw score, written for you to keep

# Audio file extensions we treat as recordings/sources.
AUDIO_EXTS = {".wav", ".flac", ".mp3", ".m4a", ".aac", ".ogg", ".opus", ".aiff", ".aif"}

# The six conditions from the plan. `negative` = a track NOT in the index (the row that
# matters most: these MUST come back as no-match, or the moat gets corrupted by false IDs).
CONDITIONS = ["quiet_0", "quiet_4", "noise_0", "noise_4", "quiet_8", "negative"]


# ---------------------------------------------------------------------------
# Panako output parsing — the part that turns Panako's CSV stdout into numbers.
# ---------------------------------------------------------------------------
# `panako query file` prints one CSV line per match it finds, columns separated by ";".
# The columns (from Panako's docs) are, 0-indexed:
#   0 Index  1 Total  2 Query path  3 Query start  4 Query stop
#   5 Match path  6 Match id  7 Match start  8 Match stop
#   9 Match score  10 Time factor (%)  11 Frequency factor (%)  12 Seconds with match (%)
# A query with no confident match prints no data row (Panako applies its own internal
# threshold — anything it returns, it is calling a genuine match).
PANAKO_COLS = 13


def parse_panako_query(stdout: str) -> list[dict]:
    """Turn Panako's stdout into a list of match rows (dicts). Empty list = no match."""
    rows: list[dict] = []
    for line in stdout.splitlines():
        line = line.strip()
        if not line or line.lower().startswith("index"):
            continue  # skip blanks and the header row
        parts = [p.strip() for p in line.split(";")]
        if len(parts) < PANAKO_COLS:
            continue  # not a data row (progress/log noise)
        try:
            score = float(parts[9])
        except ValueError:
            continue
        if score <= 0 or not parts[5]:
            continue  # no real match on this line
        rows.append({
            "match_path": parts[5],
            "score": score,
            "time_factor": _num(parts[10]),   # detected tempo change, %
            "freq_factor": _num(parts[11]),   # detected pitch change, %  <- the CQT payoff
            "seconds_pct": _num(parts[12]),    # how much of the clip matched, %
        })
    return rows


def _num(s: str) -> float:
    try:
        return float(s)
    except (ValueError, TypeError):
        return 0.0


def best_match(rows: list[dict]) -> dict | None:
    """Panako can return several candidates; the winner is the highest Match score."""
    return max(rows, key=lambda r: r["score"]) if rows else None


def stem(path_or_name: str) -> str:
    """Normalise a file path/name to a comparable track id: basename, no extension, lowercased."""
    return Path(path_or_name).stem.strip().lower()


def classify(true_track: str, matched_stem: str | None) -> str:
    """
    Turn a query outcome into one of four buckets.
      - true_track == "NONE"  -> this is a negative control (track not in the index).
            any match          = FALSE  (bad: a false positive)
            no match           = CORRECT (good: it stayed silent)
      - otherwise (should match a real track):
            matched the right track = CORRECT
            matched a different one = FALSE
            matched nothing         = NO_MATCH (a miss — bad, but far less bad than a false)
    """
    is_negative = true_track.strip().upper() == "NONE"
    if is_negative:
        return "false" if matched_stem else "correct"
    if matched_stem is None:
        return "no_match"
    return "correct" if matched_stem == stem(true_track) else "false"


# ---------------------------------------------------------------------------
# Running the external tools (Panako + AudD).
# ---------------------------------------------------------------------------
def panako_store(files: list[Path], panako_cmd: str) -> None:
    cmd = _panako_argv(panako_cmd, "store", *[str(f) for f in files])
    print(f"  indexing {len(files)} tracks: {' '.join(cmd[:2])} …")
    subprocess.run(cmd, check=True)


def panako_query(path: Path, panako_cmd: str) -> list[dict]:
    cmd = _panako_argv(panako_cmd, "query", str(path))
    out = subprocess.run(cmd, capture_output=True, text=True)
    if out.returncode != 0:
        print(f"  ! panako query failed on {path.name}: {out.stderr.strip()[:200]}", file=sys.stderr)
        return []
    return parse_panako_query(out.stdout)


def _panako_argv(panako_cmd: str, *args: str) -> list[str]:
    """`panako_cmd` may be 'panako' (on PATH) or a full 'java -jar /path/panako.jar' string."""
    return panako_cmd.split() + list(args)


def audd_query(path: Path, token: str) -> dict | None:
    """Query AudD, the commercial catalog matcher, on the SAME recording. Needs `requests`."""
    import requests  # imported lazily so the Panako-only path has no dependency
    with open(path, "rb") as fh:
        resp = requests.post(
            "https://api.audd.io/",
            data={"api_token": token, "return": "apple_music,spotify"},
            files={"file": fh},
            timeout=30,
        )
    data = resp.json()
    if data.get("status") != "success" or not data.get("result"):
        return None
    r = data["result"]
    return {"title": r.get("title", ""), "artist": r.get("artist", "")}


# ---------------------------------------------------------------------------
# Sub-commands.
# ---------------------------------------------------------------------------
def cmd_init(_args) -> None:
    """Scan recordings/ and write a manifest template for you to fill in (ground truth)."""
    SOURCES.mkdir(exist_ok=True)
    RECORDINGS.mkdir(exist_ok=True)
    recs = _audio_files(RECORDINGS)
    if MANIFEST.exists():
        print(f"{MANIFEST.name} already exists — leaving it alone so your labels aren't lost.")
        return
    with open(MANIFEST, "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["recording", "true_track", "condition", "notes"])
        for r in recs:
            w.writerow([r.name, "", "", ""])
    print(f"Wrote {MANIFEST.name} with {len(recs)} recordings.")
    print("Now fill in, for each row:")
    print("  true_track = the source filename WITHOUT extension it should match, or NONE for a negative control")
    print(f"  condition  = one of: {', '.join(CONDITIONS)}")


def cmd_index(args) -> None:
    srcs = _audio_files(SOURCES)
    if not srcs:
        sys.exit(f"No audio in {SOURCES}/ — drop your 10 source tracks there first.")
    panako_store(srcs, args.panako)
    print(f"Indexed {len(srcs)} source tracks.")


def cmd_run(args) -> None:
    """Query every recording (Panako + optional AudD), classify, aggregate, write scores.csv."""
    rows = _read_manifest()
    token = args.audd_token or os.environ.get("AUDD_API_TOKEN", "")
    if not token:
        print("(no AudD token — skipping the catalog path; pass --audd-token or set AUDD_API_TOKEN)\n")

    results = []
    for m in rows:
        rec_path = RECORDINGS / m["recording"]
        if not rec_path.exists():
            print(f"  ! missing recording file: {m['recording']}", file=sys.stderr)
            continue

        rows_p = panako_query(rec_path, args.panako)
        top = best_match(rows_p)
        matched_stem = stem(top["match_path"]) if top else None
        verdict = classify(m["true_track"], matched_stem)

        audd = audd_query(rec_path, token) if token else None

        results.append({
            "recording": m["recording"],
            "true_track": m["true_track"],
            "condition": m["condition"] or "unlabelled",
            "panako_verdict": verdict,
            "panako_matched": matched_stem or "",
            "panako_score": top["score"] if top else 0.0,
            "panako_freq_factor": top["freq_factor"] if top else 0.0,
            "panako_time_factor": top["time_factor"] if top else 0.0,
            "panako_seconds_pct": top["seconds_pct"] if top else 0.0,
            "audd_title": (audd or {}).get("title", ""),
            "audd_artist": (audd or {}).get("artist", ""),
            "audd_identified": bool(audd),
        })
        line = f"  {m['recording']:<34} {m['condition']:<10} panako={verdict:<9} score={results[-1]['panako_score']:.0f}"
        if token:
            line += f"  audd={'HIT' if audd else 'no id'}"
        print(line)

    _write_scores(results)
    _print_report(results, catalog=bool(token))


def cmd_selftest(_args) -> None:
    """Verify the parsing + scoring logic without Panako/audio (checks the harness itself)."""
    _selftest()


# ---------------------------------------------------------------------------
# Reporting.
# ---------------------------------------------------------------------------
def _print_report(results: list[dict], catalog: bool) -> None:
    by_cond: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for r in results:
        c = by_cond[r["condition"]]
        c["attempts"] += 1
        c[r["panako_verdict"]] += 1
        if catalog:
            c["audd_hit"] += 1 if r["audd_identified"] else 0

    print("\n" + "=" * 78)
    print("PANAKO — match outcomes by condition")
    print("=" * 78)
    header = f"{'condition':<12} {'attempts':>8} {'correct':>8} {'false':>7} {'no_match':>9}  match_rate"
    if catalog:
        header += f" {'audd_hit':>9}"
    print(header)
    for cond in CONDITIONS + [c for c in by_cond if c not in CONDITIONS]:
        if cond not in by_cond:
            continue
        c = by_cond[cond]
        a = c["attempts"]
        rate = (c["correct"] / a * 100) if a else 0
        line = f"{cond:<12} {a:>8} {c['correct']:>8} {c['false']:>7} {c['no_match']:>9}  {rate:>8.0f}%"
        if catalog:
            line += f" {c['audd_hit']:>9}"
        print(line)

    # The single most important number: false positives on negative controls.
    neg = by_cond.get("negative", {})
    print("\nMOST IMPORTANT ROW — negatives (tracks NOT in the index):")
    print(f"  {neg.get('false', 0)} false match(es) out of {neg.get('attempts', 0)} attempts. "
          "Any false match here is a serious problem — false IDs corrupt the database permanently.")

    # Score distribution: true matches vs false matches. Thresholds get set from this gap.
    true_scores = [r["panako_score"] for r in results if r["panako_verdict"] == "correct" and r["true_track"].upper() != "NONE"]
    false_scores = [r["panako_score"] for r in results if r["panako_verdict"] == "false"]
    print("\nSCORE DISTRIBUTION (the real deliverable — calibrates future merge thresholds):")
    print(f"  correct-match scores : {_dist(true_scores)}")
    print(f"  false-match scores   : {_dist(false_scores)}")
    print(f"\nEvery raw score written to {SCORES_CSV.name}. Success target: >70% correct at quiet_4.")


def _dist(xs: list[float]) -> str:
    if not xs:
        return "(none)"
    xs = sorted(xs)
    lo, hi = xs[0], xs[-1]
    mid = xs[len(xs) // 2]
    return f"n={len(xs)}  min={lo:.0f}  median={mid:.0f}  max={hi:.0f}"


def _write_scores(results: list[dict]) -> None:
    cols = ["recording", "true_track", "condition", "panako_verdict", "panako_matched",
            "panako_score", "panako_freq_factor", "panako_time_factor", "panako_seconds_pct",
            "audd_identified", "audd_title", "audd_artist"]
    with open(SCORES_CSV, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=cols)
        w.writeheader()
        for r in results:
            w.writerow({k: r.get(k, "") for k in cols})


# ---------------------------------------------------------------------------
# Small helpers.
# ---------------------------------------------------------------------------
def _audio_files(d: Path) -> list[Path]:
    return sorted(p for p in d.glob("*") if p.suffix.lower() in AUDIO_EXTS)


def _read_manifest() -> list[dict]:
    if not MANIFEST.exists():
        sys.exit(f"No {MANIFEST.name}. Run `python run.py init` first, then fill it in.")
    with open(MANIFEST, newline="") as fh:
        rows = [r for r in csv.DictReader(fh) if r.get("recording")]
    unlabelled = [r["recording"] for r in rows if not r.get("true_track")]
    if unlabelled:
        sys.exit(f"{len(unlabelled)} rows in {MANIFEST.name} have no true_track. Fill them in "
                 f"(use NONE for negative controls). First: {unlabelled[0]}")
    return rows


def _selftest() -> None:
    # A Panako hit line (semicolon CSV): recording matched source 'deep_cut' with score 88,
    # detecting +4% pitch (freq factor 104).
    hit = "0; 1; rec.wav; 0.0; 12.0; /music/deep_cut.wav; 3; 10.0; 22.0; 88; 104.0; 104.0; 91.0"
    rows = parse_panako_query("Index; Total; ...header...\n" + hit)
    assert len(rows) == 1 and rows[0]["score"] == 88, rows
    assert stem(rows[0]["match_path"]) == "deep_cut"
    assert classify("deep_cut", stem(rows[0]["match_path"])) == "correct"
    assert classify("other_track", stem(rows[0]["match_path"])) == "false"
    # No data row = no match.
    assert parse_panako_query("Index; Total; header\n") == []
    assert best_match([]) is None
    assert classify("deep_cut", None) == "no_match"
    # Negative control: a match is BAD, silence is GOOD.
    assert classify("NONE", "anything") == "false"
    assert classify("NONE", None) == "correct"
    print("selftest: all assertions passed ✓")


def main() -> None:
    p = argparse.ArgumentParser(description="Stage 0 fingerprint-recognition validation harness.")
    p.add_argument("--panako", default="panako",
                   help="How to call Panako. Default 'panako'. Or e.g. 'java -jar /path/panako.jar'.")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("init", help="scan recordings/ and write a manifest template to fill in").set_defaults(func=cmd_init)
    sub.add_parser("index", help="index the source tracks in sources/ with Panako").set_defaults(func=cmd_index)
    rp = sub.add_parser("run", help="query every recording, classify, and report")
    rp.add_argument("--audd-token", default="", help="AudD API token for the catalog path (or set AUDD_API_TOKEN)")
    rp.set_defaults(func=cmd_run)
    sub.add_parser("selftest", help="verify the harness logic without Panako/audio").set_defaults(func=cmd_selftest)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
