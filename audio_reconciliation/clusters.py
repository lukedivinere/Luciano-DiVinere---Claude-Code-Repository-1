"""Storage and grouping of unknown clusters."""

from __future__ import annotations

from itertools import count
from typing import Iterable, Optional

from .models import (
    AudioCharacteristics,
    ClusterMember,
    ClusterStatus,
    UnknownCluster,
    cosine_similarity,
)


class ClusterStore:
    """In-memory home for unknown clusters.

    A miss is assigned to the most similar *active* cluster whose similarity
    clears ``similarity_threshold``; if none qualifies a fresh cluster is
    created. Retired clusters never accept new members and are skipped when
    looking for a home.
    """

    def __init__(self, similarity_threshold: float = 0.85) -> None:
        self.similarity_threshold = similarity_threshold
        self._clusters: dict[str, UnknownCluster] = {}
        self._ids = count(1)

    # ---- lookup -----------------------------------------------------------

    def get(self, cluster_id: str) -> Optional[UnknownCluster]:
        return self._clusters.get(cluster_id)

    def all(self) -> list[UnknownCluster]:
        return list(self._clusters.values())

    def active(self) -> list[UnknownCluster]:
        return [c for c in self._clusters.values() if c.is_active]

    def retired(self) -> list[UnknownCluster]:
        return [c for c in self._clusters.values() if not c.is_active]

    # ---- mutation ---------------------------------------------------------

    def _new_id(self) -> str:
        return f"cluster-{next(self._ids)}"

    def assign(
        self,
        *,
        characteristics: AudioCharacteristics,
        session_id: str,
        audio_id: str,
        attempt_id: str,
    ) -> UnknownCluster:
        """Park a miss in a cluster, creating one if nothing is close enough."""
        member = ClusterMember(
            session_id=session_id,
            audio_id=audio_id,
            attempt_id=attempt_id,
            characteristics=characteristics,
        )

        home = self._closest_active(characteristics.fingerprint)
        if home is None:
            home = UnknownCluster(
                cluster_id=self._new_id(),
                status=ClusterStatus.ACTIVE,
                created_by_attempt=attempt_id,
            )
            self._clusters[home.cluster_id] = home
        home.add_member(member)
        return home

    def _closest_active(
        self, fingerprint: tuple[float, ...]
    ) -> Optional[UnknownCluster]:
        best: Optional[UnknownCluster] = None
        best_score = self.similarity_threshold
        for cluster in self._clusters.values():
            if not cluster.is_active or not cluster.members:
                continue
            # Compare against the cluster's founding member; good enough for a
            # tight similarity threshold and avoids centroid drift bookkeeping.
            score = cosine_similarity(
                fingerprint, cluster.members[0].characteristics.fingerprint
            )
            if score >= best_score:
                best_score = score
                best = cluster
        return best

    def clusters_holding(
        self, session_id: str, audio_id: str
    ) -> list[UnknownCluster]:
        """Every active cluster with a member contributed by (session, audio)."""
        return [
            c
            for c in self._clusters.values()
            if c.is_active and c.members_for(session_id, audio_id)
        ]


__all__ = ["ClusterStore"]
