"""Tests for session-level reconciliation and miss logging.

Runs on the stdlib ``unittest`` (no third-party deps): ``python -m unittest``.
"""

from __future__ import annotations

import unittest

from audio_reconciliation import (
    AttemptOutcome,
    AudioCharacteristics,
    ClusterStatus,
    InMemoryCatalogMatcher,
    ReconciliationEngine,
)


def characteristics(fingerprint, **overrides):
    base = dict(
        fingerprint=tuple(fingerprint),
        duration_s=12.0,
        sample_rate_hz=44100,
        channels=2,
        rms_dbfs=-18.0,
        peak_dbfs=-1.0,
        snr_db=22.0,
    )
    base.update(overrides)
    return AudioCharacteristics(**base)


# Two well-separated fingerprints so "same audio" vs "different audio" is
# unambiguous under cosine similarity.
FP_SONG_A = (1.0, 0.0, 0.0, 0.0)
FP_SONG_B = (0.0, 1.0, 0.0, 0.0)


class RetryResolvesTest(unittest.TestCase):
    def setUp(self):
        # Catalog starts empty: the first attempt is guaranteed to miss.
        self.matcher = InMemoryCatalogMatcher(threshold=0.9)
        self.engine = ReconciliationEngine(self.matcher)

    def test_first_attempt_misses_and_parks_an_unknown_cluster(self):
        result = self.engine.identify(
            session_id="s1", audio_id="a1", characteristics=characteristics(FP_SONG_A)
        )
        self.assertEqual(result.outcome, AttemptOutcome.MISS)
        self.assertIsNotNone(result.cluster_id)
        self.assertEqual(len(self.engine.clusters.active()), 1)
        self.assertEqual(len(self.engine.miss_log), 1)

    def test_retry_hit_retires_earlier_unknown_cluster(self):
        # Attempt 1: miss -> parks cluster.
        miss = self.engine.identify(
            session_id="s1", audio_id="a1", characteristics=characteristics(FP_SONG_A)
        )
        self.assertEqual(miss.outcome, AttemptOutcome.MISS)
        cluster_id = miss.cluster_id

        # Between attempts the catalog grows to include song A.
        self.matcher.add("catalog-A", FP_SONG_A, title="Song A")

        # Attempt 2: same session, same audio, now a hit.
        hit = self.engine.identify(
            session_id="s1", audio_id="a1", characteristics=characteristics(FP_SONG_A)
        )
        self.assertEqual(hit.outcome, AttemptOutcome.MATCH)
        self.assertEqual(hit.catalog_match.catalog_id, "catalog-A")

        # The earlier unknown cluster is retired and annotated.
        self.assertIn(cluster_id, hit.retired_cluster_ids)
        cluster = self.engine.clusters.get(cluster_id)
        self.assertEqual(cluster.status, ClusterStatus.RETIRED)
        self.assertEqual(cluster.superseded_by_catalog_id, "catalog-A")
        self.assertEqual(cluster.resolved_by_attempt, hit.attempt.attempt_id)
        self.assertEqual(self.engine.clusters.active(), [])

    def test_multiple_earlier_misses_all_retired(self):
        m1 = self.engine.identify(
            session_id="s1", audio_id="a1", characteristics=characteristics(FP_SONG_A)
        )
        # A second, slightly different miss on the same audio that lands in a
        # *separate* cluster (make it dissimilar enough to not join m1's).
        m2 = self.engine.identify(
            session_id="s1", audio_id="a1", characteristics=characteristics(FP_SONG_B)
        )
        self.assertNotEqual(m1.cluster_id, m2.cluster_id)

        self.matcher.add("catalog-A", FP_SONG_A)
        hit = self.engine.identify(
            session_id="s1", audio_id="a1", characteristics=characteristics(FP_SONG_A)
        )
        self.assertEqual(hit.outcome, AttemptOutcome.MATCH)
        self.assertCountEqual(
            hit.retired_cluster_ids, [m1.cluster_id, m2.cluster_id]
        )
        self.assertEqual(self.engine.clusters.active(), [])


class ReconciliationScopingTest(unittest.TestCase):
    def setUp(self):
        self.matcher = InMemoryCatalogMatcher(threshold=0.9)
        self.engine = ReconciliationEngine(self.matcher)

    def test_other_sessions_clusters_are_untouched(self):
        # Session s2 misses on audio a1 and parks a cluster.
        other = self.engine.identify(
            session_id="s2", audio_id="a1", characteristics=characteristics(FP_SONG_A)
        )
        # Session s1 misses then hits on its own audio a1.
        mine = self.engine.identify(
            session_id="s1", audio_id="a1", characteristics=characteristics(FP_SONG_B)
        )
        self.matcher.add("catalog-B", FP_SONG_B)
        hit = self.engine.identify(
            session_id="s1", audio_id="a1", characteristics=characteristics(FP_SONG_B)
        )

        self.assertIn(mine.cluster_id, hit.retired_cluster_ids)
        # The other session's cluster is not retired.
        self.assertNotIn(other.cluster_id, hit.retired_cluster_ids)
        self.assertEqual(
            self.engine.clusters.get(other.cluster_id).status, ClusterStatus.ACTIVE
        )

    def test_shared_cluster_keeps_other_audios_members(self):
        # Two different audios in the same session miss with near-identical
        # fingerprints, so they share one cluster.
        fp1 = (1.0, 0.0, 0.0, 0.0)
        fp2 = (0.999, 0.001, 0.0, 0.0)
        a1 = self.engine.identify(
            session_id="s1", audio_id="a1", characteristics=characteristics(fp1)
        )
        a2 = self.engine.identify(
            session_id="s1", audio_id="a2", characteristics=characteristics(fp2)
        )
        self.assertEqual(a1.cluster_id, a2.cluster_id)  # shared cluster
        cluster_id = a1.cluster_id

        # a1 later resolves.
        self.matcher.add("catalog-A", fp1)
        hit = self.engine.identify(
            session_id="s1", audio_id="a1", characteristics=characteristics(fp1)
        )

        # Cluster is NOT retired — a2 is still an unknown pinned there — but a1's
        # membership has been pruned out.
        self.assertNotIn(cluster_id, hit.retired_cluster_ids)
        cluster = self.engine.clusters.get(cluster_id)
        self.assertEqual(cluster.status, ClusterStatus.ACTIVE)
        self.assertEqual(cluster.members_for("s1", "a1"), [])
        self.assertEqual(len(cluster.members_for("s1", "a2")), 1)

    def test_first_time_hit_retires_nothing(self):
        self.matcher.add("catalog-A", FP_SONG_A)
        hit = self.engine.identify(
            session_id="s1", audio_id="a1", characteristics=characteristics(FP_SONG_A)
        )
        self.assertEqual(hit.outcome, AttemptOutcome.MATCH)
        self.assertEqual(hit.retired_cluster_ids, [])


class MissLoggingTest(unittest.TestCase):
    def setUp(self):
        self.matcher = InMemoryCatalogMatcher(threshold=0.9)
        self.engine = ReconciliationEngine(self.matcher)

    def test_every_miss_logged_with_characteristics(self):
        chars = characteristics(FP_SONG_A, snr_db=8.5, rms_dbfs=-31.0)
        self.engine.identify(session_id="s1", audio_id="a1", characteristics=chars)

        records = self.engine.miss_log.for_audio("s1", "a1")
        self.assertEqual(len(records), 1)
        rec = records[0]
        self.assertEqual(rec.reason, "no_catalog_match")
        self.assertIsNotNone(rec.cluster_id)

        payload = rec.as_dict()
        self.assertEqual(payload["event"], "catalog_miss")
        self.assertEqual(payload["audio"]["snr_db"], 8.5)
        self.assertEqual(payload["audio"]["rms_dbfs"], -31.0)
        self.assertEqual(payload["audio"]["sample_rate_hz"], 44100)
        self.assertIn("fingerprint_digest", payload["audio"])

    def test_hit_does_not_log_a_miss(self):
        self.matcher.add("catalog-A", FP_SONG_A)
        self.engine.identify(
            session_id="s1", audio_id="a1", characteristics=characteristics(FP_SONG_A)
        )
        self.assertEqual(len(self.engine.miss_log), 0)

    def test_miss_log_survives_reconciliation(self):
        # The evidence trail is not erased when a cluster is retired.
        self.engine.identify(
            session_id="s1", audio_id="a1", characteristics=characteristics(FP_SONG_A)
        )
        self.matcher.add("catalog-A", FP_SONG_A)
        self.engine.identify(
            session_id="s1", audio_id="a1", characteristics=characteristics(FP_SONG_A)
        )
        self.assertEqual(len(self.engine.miss_log.for_audio("s1", "a1")), 1)


if __name__ == "__main__":
    unittest.main()
