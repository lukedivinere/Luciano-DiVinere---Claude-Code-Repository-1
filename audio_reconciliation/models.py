"""Core data models for audio catalog matching and session reconciliation.

The domain, in one breath: audio comes in, we try to match it against a
catalog. A *hit* resolves to a catalog entry. A *miss* gets its unidentified
fingerprint parked in an "unknown cluster" so similar unknowns pile up together
for later triage. Within a single session an audio may be attempted more than
once (a retry with a better segment, cleaner denoising, a bigger catalog, ...).
When one of those retries finally hits, the unknown clusters spawned by the
earlier missing attempts on *that same audio* are stale evidence and should be
retired.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field, replace
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass(frozen=True)
class AudioCharacteristics:
    """A snapshot of what we measured about a piece of audio at attempt time.

    ``fingerprint`` is what the matcher and the clusterer compare on. The rest
    are diagnostic signals — the stuff you actually want in front of you when a
    match keeps missing and you're trying to figure out why.
    """

    fingerprint: tuple[float, ...]
    duration_s: float
    sample_rate_hz: int
    channels: int
    rms_dbfs: Optional[float] = None
    peak_dbfs: Optional[float] = None
    snr_db: Optional[float] = None
    # Anything else worth remembering: codec, bitrate, source, segment offsets…
    extra: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        """Flatten to a JSON-serializable dict for logging.

        The raw fingerprint vector is usually large and rarely useful in a log
        line, so we record its dimensionality and a stable digest instead of
        every coefficient. Everything a human would use to diagnose a miss is
        kept verbatim.
        """
        return {
            "fingerprint_dims": len(self.fingerprint),
            "fingerprint_digest": self.fingerprint_digest(),
            "duration_s": self.duration_s,
            "sample_rate_hz": self.sample_rate_hz,
            "channels": self.channels,
            "rms_dbfs": self.rms_dbfs,
            "peak_dbfs": self.peak_dbfs,
            "snr_db": self.snr_db,
            "extra": dict(self.extra),
        }

    def fingerprint_digest(self) -> str:
        """A short, stable digest of the fingerprint vector.

        Enough to eyeball whether two miss records came from the same audio
        without dumping the whole vector into the log.
        """
        import hashlib

        # Round to tame float noise so equal-in-practice vectors digest equally.
        payload = ",".join(f"{x:.6g}" for x in self.fingerprint).encode("utf-8")
        return hashlib.sha1(payload).hexdigest()[:12]


@dataclass(frozen=True)
class CatalogMatch:
    """A successful resolution against the catalog."""

    catalog_id: str
    confidence: float
    title: Optional[str] = None
    metadata: dict[str, Any] = field(default_factory=dict)


class AttemptOutcome(str, Enum):
    MATCH = "match"
    MISS = "miss"


@dataclass
class Attempt:
    """One identification attempt on one audio, within one session."""

    attempt_id: str
    session_id: str
    audio_id: str
    characteristics: AudioCharacteristics
    outcome: AttemptOutcome
    created_at: datetime = field(default_factory=_utcnow)
    catalog_match: Optional[CatalogMatch] = None
    cluster_id: Optional[str] = None


@dataclass
class ClusterMember:
    """A single audio's contribution to an unknown cluster."""

    session_id: str
    audio_id: str
    attempt_id: str
    characteristics: AudioCharacteristics
    added_at: datetime = field(default_factory=_utcnow)


class ClusterStatus(str, Enum):
    ACTIVE = "active"
    RETIRED = "retired"


@dataclass
class UnknownCluster:
    """A bucket of unidentified audio that fingerprinted alike.

    A cluster is *created by* the attempt that first parked a miss in it and
    accumulates members as more misses land nearby. Reconciliation removes the
    members belonging to an audio that later turned out to be known; a cluster
    left with no members is retired outright.
    """

    cluster_id: str
    status: ClusterStatus = ClusterStatus.ACTIVE
    members: list[ClusterMember] = field(default_factory=list)
    created_at: datetime = field(default_factory=_utcnow)
    created_by_attempt: Optional[str] = None
    retired_at: Optional[datetime] = None
    retired_reason: Optional[str] = None
    superseded_by_catalog_id: Optional[str] = None
    resolved_by_attempt: Optional[str] = None

    def add_member(self, member: ClusterMember) -> None:
        self.members.append(member)

    def members_for(self, session_id: str, audio_id: str) -> list[ClusterMember]:
        return [
            m
            for m in self.members
            if m.session_id == session_id and m.audio_id == audio_id
        ]

    def remove_members_for(self, session_id: str, audio_id: str) -> list[ClusterMember]:
        """Drop and return every member contributed by (session, audio)."""
        removed = self.members_for(session_id, audio_id)
        if removed:
            kept = [
                m
                for m in self.members
                if not (m.session_id == session_id and m.audio_id == audio_id)
            ]
            self.members = kept
        return removed

    def is_empty(self) -> bool:
        return not self.members

    @property
    def is_active(self) -> bool:
        return self.status is ClusterStatus.ACTIVE

    def retire(
        self,
        *,
        reason: str,
        catalog_id: Optional[str] = None,
        resolved_by_attempt: Optional[str] = None,
        at: Optional[datetime] = None,
    ) -> None:
        self.status = ClusterStatus.RETIRED
        self.retired_at = at or _utcnow()
        self.retired_reason = reason
        self.superseded_by_catalog_id = catalog_id
        self.resolved_by_attempt = resolved_by_attempt


@dataclass
class MissRecord:
    """A durable note that an attempt missed, with the audio's characteristics.

    This is the evidence trail: every miss, what it looked like, and where its
    fingerprint got parked.
    """

    session_id: str
    audio_id: str
    attempt_id: str
    characteristics: AudioCharacteristics
    reason: str
    cluster_id: Optional[str] = None
    logged_at: datetime = field(default_factory=_utcnow)

    def as_dict(self) -> dict[str, Any]:
        return {
            "event": "catalog_miss",
            "session_id": self.session_id,
            "audio_id": self.audio_id,
            "attempt_id": self.attempt_id,
            "reason": self.reason,
            "cluster_id": self.cluster_id,
            "logged_at": self.logged_at.isoformat(),
            "audio": self.characteristics.as_dict(),
        }


@dataclass
class IdentifyResult:
    """What a single call to the engine produced."""

    outcome: AttemptOutcome
    attempt: Attempt
    catalog_match: Optional[CatalogMatch] = None
    cluster_id: Optional[str] = None
    # Clusters retired by reconciliation because this attempt resolved the audio.
    retired_cluster_ids: list[str] = field(default_factory=list)

    @property
    def is_match(self) -> bool:
        return self.outcome is AttemptOutcome.MATCH


def cosine_similarity(a: tuple[float, ...], b: tuple[float, ...]) -> float:
    """Cosine similarity of two fingerprint vectors, in [-1, 1].

    Mismatched lengths or a zero vector yield 0.0 (treated as "not similar")
    rather than raising, so a degenerate fingerprint can't crash matching.
    """
    if len(a) != len(b) or not a:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0.0 or nb == 0.0:
        return 0.0
    return dot / (na * nb)


# Re-exported for callers that want to build derived characteristics.
__all__ = [
    "AudioCharacteristics",
    "CatalogMatch",
    "AttemptOutcome",
    "Attempt",
    "ClusterMember",
    "ClusterStatus",
    "UnknownCluster",
    "MissRecord",
    "IdentifyResult",
    "cosine_similarity",
    "replace",
]
