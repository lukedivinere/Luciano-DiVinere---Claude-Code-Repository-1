# Luciano-DiVinere---Claude-Code-Repository-1

Session-level reconciliation for audio catalog matching.

Audio comes in, we try to match it against a catalog. A **hit** resolves to a
catalog entry. A **miss** parks the unidentified fingerprint in an *unknown
cluster* so similar unknowns pile up together for later triage. Within one
session an audio may be attempted more than once — a retry with a cleaner
segment, better denoising, or a catalog that has since grown. When one of those
retries finally hits, the unknown clusters left behind by the earlier missing
attempts on **that same audio** are stale evidence.

This package handles that:

- **Session-level reconciliation** — when a retry within the same session
  resolves an audio to a catalog match, the unknown clusters created by that
  audio's earlier attempts are retired (and annotated with the catalog id and
  the attempt that resolved them). Reconciliation is scoped tightly: it only
  touches the same session and the same audio, and a cluster that still holds
  members from *other* audio stays active — only that audio's membership is
  pruned out.
- **Miss logging** — every miss is recorded with its full audio characteristics
  (duration, sample rate, channels, RMS/peak dBFS, SNR, a fingerprint digest,
  and any extra fields) both as a queryable record and as a structured JSON log
  line, so recurring failures can be diagnosed from evidence instead of guesses.

## Usage

```python
from audio_reconciliation import (
    ReconciliationEngine,
    InMemoryCatalogMatcher,
    AudioCharacteristics,
)

matcher = InMemoryCatalogMatcher(threshold=0.9)
engine = ReconciliationEngine(matcher)

chars = AudioCharacteristics(
    fingerprint=(1.0, 0.0, 0.0, 0.0),
    duration_s=12.0, sample_rate_hz=44100, channels=2,
    rms_dbfs=-18.0, peak_dbfs=-1.0, snr_db=6.0,
)

# Attempt 1: catalog doesn't know this yet -> miss, parked in an unknown cluster.
r1 = engine.identify(session_id="sess-42", audio_id="clip-7", characteristics=chars)

# Catalog grows to include the track...
matcher.add("CAT-999", (1.0, 0.0, 0.0, 0.0), title="Recovered Track")

# Attempt 2 (retry): now a hit -> the earlier unknown cluster is retired.
r2 = engine.identify(session_id="sess-42", audio_id="clip-7", characteristics=chars)
assert r2.is_match
assert r1.cluster_id in r2.retired_cluster_ids
```

`ReconciliationEngine` depends only on the `CatalogMatcher` protocol
(`match(characteristics) -> CatalogMatch | None`), so a real deployment can drop
in whatever fingerprint index it uses in place of `InMemoryCatalogMatcher`.
Cluster storage and the miss log are likewise injectable.

## Layout

| Module | Responsibility |
| --- | --- |
| `audio_reconciliation/models.py` | Data models (characteristics, attempts, clusters, miss records) and fingerprint similarity |
| `audio_reconciliation/matcher.py` | `CatalogMatcher` protocol + in-memory implementation |
| `audio_reconciliation/clusters.py` | Unknown-cluster storage and grouping |
| `audio_reconciliation/miss_log.py` | Durable, queryable miss logging |
| `audio_reconciliation/engine.py` | The engine tying it together, including reconciliation |

## Tests

Standard library only — no third-party dependencies:

```bash
python -m unittest discover -s tests -v
```
