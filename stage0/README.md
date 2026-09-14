# Stage 0 — does the matching actually work?

This is the **single most important test in the whole project**, and it is deliberately *not*
the app. It's a small command-line tool that produces one thing: **numbers** that tell you
whether pitch-robust fingerprinting survives real, phone-recorded, club-style audio.

If it works, the rest of iDROP is worth building. If it doesn't, we learn that now — in an
evening — instead of after months of app work.

> **There are two Stage 0 tools in this repo — they answer different questions, keep both:**
> - **`scripts/stage0.mjs`** (Node): a *quick, automated* check of the app's **current** JS
>   fingerprinter (`public/fingerprint.js`) on **synthetically** degraded audio (ffmpeg pitch
>   shift + added noise). No recordings needed, runs in minutes — but synthetic degradation is
>   **over-optimistic**: it can't reproduce a phone mic, room reverb, PA distortion or a real
>   crowd. Use it to sanity-check "is what we already shipped any good?"
> - **`stage0/`** (this Python tool): the *real* test the recognition-engine prompt specifies —
>   **Panako** (the pitch-robust engine we'd actually adopt) against **real phone recordings you
>   make**, plus an AudD comparison. Slower to set up, but it's the honest answer.
>
> The plan: run the Node one first for a fast read on the current engine, then run this one for
> the real verdict that decides whether we build the full engine.

---

## The idea in one paragraph

A fingerprint matcher doesn't "listen" like a person. It boils audio down to a set of
landmarks — Panako uses points in a **constant-Q spectrogram**, which is the specific trick
that keeps working when a DJ pitches a track up. You **index** your 10 tracks (Panako learns
their landmarks), then you **query** a phone recording (Panako extracts the same landmarks and
counts how many line up at a consistent time offset). That count is the **match score**. This
harness runs that loop over recordings you make under different conditions and tallies the
results.

Two kinds of error, and they are *not* equally bad:
- **Miss** (`no_match`): it failed to recognise a track it should have. Annoying.
- **False match** (`false`): it confidently named the *wrong* track — or named a track it has
  never seen. **This is the dangerous one.** In the real product a false match corrupts the
  unreleased-ID database permanently. The negative-control recordings (row 6 below) exist to
  hunt for exactly this.

---

## What you need to install (on your laptop — not in the cloud)

Stage 0 has to run where your audio is. It needs three things:

1. **Java 17+** (Panako is a Java program). Check: `java -version`.
2. **ffmpeg** on your PATH (Panako decodes audio by calling ffmpeg). Check: `ffmpeg -version`.
   - macOS: `brew install ffmpeg` · Ubuntu: `sudo apt install ffmpeg`
3. **Panako** — download the prebuilt "all" jar (no building needed):
   ```bash
   curl -L -o ~/panako.jar \
     https://github.com/JorenSix/Panako/releases/download/joss/Panako-2.1-all.jar
   java -jar ~/panako.jar      # prints its config/help = it works
   ```
   This harness auto-detects `~/panako.jar`. (If you put it elsewhere, pass
   `--panako "java -jar /full/path/panako.jar"`.)

   > **Which engine:** Panako bundles two algorithms and *defaults to OLAF, which is NOT
   > pitch-robust.* This harness always forces `STRATEGY=panako` (the constant-Q, pitch-robust
   > engine) so we test the right thing. To compare against the weaker one, add `--strategy olaf`.
4. **Python 3.9+** (for this harness). For the AudD comparison only: `pip install requests`.

---

## The audio you provide

### `sources/` — the 10 tracks to recognise
Drop **10 house/EDM tracks you own**, as clean studio files (WAV / FLAC / 320 MP3), into
`stage0/sources/`. The filename (without extension) becomes the track's id — keep them simple,
e.g. `deep_cut.wav`, `night_call.flac`.

### `recordings/` — your phone captures
For each source track, play it through a speaker and record ~**10–15 seconds** on your phone,
under these conditions. Also record a few tracks that are **not** in `sources/`.

| condition label | what to do | pitch |
|---|---|---|
| `quiet_0` | quiet-ish room | 0% |
| `quiet_4` | quiet-ish room | **+4%** |
| `noise_0` | background noise (people talking / a crowd-noise video) | 0% |
| `noise_4` | background noise | **+4%** |
| `quiet_8` | quiet-ish room | **+8%** (edge of tolerance) |
| `negative` | a track **NOT** in `sources/` | any |

**Two things that matter:**
- Make the pitch shift with **key-lock OFF** (rekordbox / Serato / Traktor tempo fader, or any
  turntable-style pitch). A DJ pushing the pitch fader moves tempo *and* pitch together — that's
  the real failure mode, and key-lock would hide it.
- The `negative` rows are the ones I care about most. They must come back as **no match**.

Name the files however you like; you'll label them in the manifest next.

---

## Running it (three commands)

```bash
cd stage0

# 1. Scan your recordings and make a labels template.
python run.py init
#    -> writes manifest.csv, one row per recording. Open it and fill in, per row:
#         true_track = the source filename WITHOUT extension it should match
#                      (or NONE for a negative control)
#         condition  = one of: quiet_0, quiet_4, noise_0, noise_4, quiet_8, negative

# 2. Teach Panako your 10 source tracks.
python run.py index

# 3. Query every recording and print the report + write scores.csv.
python run.py run                          # Panako only
python run.py run --audd-token YOUR_TOKEN   # also run the catalog matcher on the same audio
```

If your Panako isn't on PATH:
`python run.py --panako "java -jar ~/.panako/panako.jar" index` (same flag on `run`).

---

## Reading the output

The report prints one row per condition:

```
condition     attempts  correct   false  no_match   match_rate
quiet_0             10       10       0         0        100%
quiet_4             10        8       0         2         80%
...
negative             5        0       0         5          0%   <- correct = it matched NOTHING
```

- **match_rate** = correct ÷ attempts. **Success target: >70% at `quiet_4`.**
- On the `negative` row, "correct" means it *stayed silent*. Any number in that row's `false`
  column is a red flag.
- **`scores.csv`** holds every raw score. The report also prints the **score distribution** —
  the min/median/max of correct-match scores versus false-match scores. The *gap* between those
  two is the whole game: it's what the next stage's merge thresholds (`T_HARD`, `T_SOFT`) get
  set from. Keep this file.

`python run.py selftest` checks the harness's own logic (parsing + scoring) without needing
Panako or audio — handy to confirm the tool itself is sane before you trust its numbers.

---

## What happens with these numbers

You paste me the table + `scores.csv`. Then:
- **If `quiet_4` clears ~70% and negatives stay clean** → Panako is viable; we build the real
  dual-path engine (Prompt 2) and calibrate its thresholds from your score distribution.
- **If it doesn't** → we do *not* build Prompt 2 as written. We'd look at Olaf, a different
  fingerprinter, or rethink the approach — having learned it cheaply, which is the entire point
  of Stage 0.
