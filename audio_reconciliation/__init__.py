"""Session-level reconciliation for audio catalog matching.

When a retry within the same session resolves an audio to a catalog match, the
unknown clusters spawned by that audio's earlier missing attempts are retired.
Every miss is logged with its audio characteristics so recurring failures can be
diagnosed from evidence.
"""

from __future__ import annotations

from .clusters import ClusterStore
from .engine import ReconciliationEngine
from .matcher import CatalogMatcher, InMemoryCatalogMatcher
from .miss_log import MissLog
from .models import (
    Attempt,
    AttemptOutcome,
    AudioCharacteristics,
    CatalogMatch,
    ClusterMember,
    ClusterStatus,
    IdentifyResult,
    MissRecord,
    UnknownCluster,
    cosine_similarity,
)

__all__ = [
    "ReconciliationEngine",
    "ClusterStore",
    "MissLog",
    "CatalogMatcher",
    "InMemoryCatalogMatcher",
    "AudioCharacteristics",
    "CatalogMatch",
    "Attempt",
    "AttemptOutcome",
    "ClusterMember",
    "ClusterStatus",
    "UnknownCluster",
    "MissRecord",
    "IdentifyResult",
    "cosine_similarity",
]
