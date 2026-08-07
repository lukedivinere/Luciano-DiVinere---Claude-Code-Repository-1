"""The reconciliation engine — where hits, misses, and retries come together.

Call :meth:`ReconciliationEngine.identify` once per attempt. On a hit the
engine performs *session-level reconciliation*: it retires the unknown clusters
that earlier missing attempts on the *same audio in the same session* left
behind, because that audio is now known and its parked fingerprints are stale.
On a miss it logs the audio's characteristics and parks the fingerprint in an
unknown cluster.
"""

from __future__ import annotations

import logging
from itertools import count
from typing import Optional

from .clusters import ClusterStore
from .matcher import CatalogMatcher
from .miss_log import MissLog
from .models import (
    Attempt,
    AttemptOutcome,
    AudioCharacteristics,
    CatalogMatch,
    IdentifyResult,
    UnknownCluster,
)

_LOG = logging.getLogger("audio_reconciliation.engine")


class ReconciliationEngine:
    def __init__(
        self,
        matcher: CatalogMatcher,
        *,
        cluster_store: Optional[ClusterStore] = None,
        miss_log: Optional[MissLog] = None,
    ) -> None:
        self.matcher = matcher
        self.clusters = cluster_store or ClusterStore()
        self.miss_log = miss_log or MissLog()
        # All attempts, in order, so reconciliation can look back over a session.
        self._attempts: list[Attempt] = []
        self._attempt_ids = count(1)

    # ---- public API -------------------------------------------------------

    def identify(
        self,
        *,
        session_id: str,
        audio_id: str,
        characteristics: AudioCharacteristics,
    ) -> IdentifyResult:
        """Attempt to identify one audio and record the outcome."""
        attempt_id = f"attempt-{next(self._attempt_ids)}"
        match = self.matcher.match(characteristics)

        if match is not None:
            return self._on_match(
                session_id=session_id,
                audio_id=audio_id,
                attempt_id=attempt_id,
                characteristics=characteristics,
                match=match,
            )
        return self._on_miss(
            session_id=session_id,
            audio_id=audio_id,
            attempt_id=attempt_id,
            characteristics=characteristics,
        )

    def attempts(self) -> list[Attempt]:
        return list(self._attempts)

    def attempts_for(self, session_id: str, audio_id: str) -> list[Attempt]:
        return [
            a
            for a in self._attempts
            if a.session_id == session_id and a.audio_id == audio_id
        ]

    # ---- outcomes ---------------------------------------------------------

    def _on_match(
        self,
        *,
        session_id: str,
        audio_id: str,
        attempt_id: str,
        characteristics: AudioCharacteristics,
        match: CatalogMatch,
    ) -> IdentifyResult:
        attempt = Attempt(
            attempt_id=attempt_id,
            session_id=session_id,
            audio_id=audio_id,
            characteristics=characteristics,
            outcome=AttemptOutcome.MATCH,
            catalog_match=match,
        )
        self._attempts.append(attempt)

        retired = self._reconcile(
            session_id=session_id,
            audio_id=audio_id,
            resolving_attempt=attempt,
            match=match,
        )
        return IdentifyResult(
            outcome=AttemptOutcome.MATCH,
            attempt=attempt,
            catalog_match=match,
            retired_cluster_ids=retired,
        )

    def _on_miss(
        self,
        *,
        session_id: str,
        audio_id: str,
        attempt_id: str,
        characteristics: AudioCharacteristics,
    ) -> IdentifyResult:
        cluster = self.clusters.assign(
            characteristics=characteristics,
            session_id=session_id,
            audio_id=audio_id,
            attempt_id=attempt_id,
        )
        self.miss_log.log(
            session_id=session_id,
            audio_id=audio_id,
            attempt_id=attempt_id,
            characteristics=characteristics,
            reason="no_catalog_match",
            cluster_id=cluster.cluster_id,
        )
        attempt = Attempt(
            attempt_id=attempt_id,
            session_id=session_id,
            audio_id=audio_id,
            characteristics=characteristics,
            outcome=AttemptOutcome.MISS,
            cluster_id=cluster.cluster_id,
        )
        self._attempts.append(attempt)
        return IdentifyResult(
            outcome=AttemptOutcome.MISS,
            attempt=attempt,
            cluster_id=cluster.cluster_id,
        )

    # ---- reconciliation ---------------------------------------------------

    def _reconcile(
        self,
        *,
        session_id: str,
        audio_id: str,
        resolving_attempt: Attempt,
        match: CatalogMatch,
    ) -> list[str]:
        """Retire the unknown clusters left by earlier misses on this audio.

        We only touch this session and this audio. A cluster's members that
        came from this (session, audio) are removed — that audio's fingerprint
        is no longer "unknown". A cluster left empty is retired outright and
        annotated with the catalog match that resolved it. A cluster that still
        holds members from *other* audio stays active: it's genuine evidence
        about those other unknowns, not stale.
        """
        retired: list[str] = []
        for cluster in self.clusters.clusters_holding(session_id, audio_id):
            removed = cluster.remove_members_for(session_id, audio_id)
            if not removed:
                continue
            if cluster.is_empty():
                cluster.retire(
                    reason="superseded_by_catalog_match",
                    catalog_id=match.catalog_id,
                    resolved_by_attempt=resolving_attempt.attempt_id,
                    at=resolving_attempt.created_at,
                )
                retired.append(cluster.cluster_id)
                _LOG.info(
                    "reconciled: retired %s for audio %s in session %s "
                    "(resolved to catalog %s by %s)",
                    cluster.cluster_id,
                    audio_id,
                    session_id,
                    match.catalog_id,
                    resolving_attempt.attempt_id,
                )
            else:
                _LOG.info(
                    "reconciled: pruned audio %s from %s in session %s; "
                    "cluster kept (still holds %d member(s) from other audio)",
                    audio_id,
                    cluster.cluster_id,
                    session_id,
                    len(cluster.members),
                )
        return retired


__all__ = ["ReconciliationEngine"]
