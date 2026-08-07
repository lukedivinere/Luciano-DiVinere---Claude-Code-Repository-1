"""Durable, queryable logging of catalog misses.

Every miss is recorded twice: as a structured :class:`MissRecord` kept in
memory for programmatic diagnosis, and as a JSON line emitted through the
standard :mod:`logging` machinery so it lands wherever the app's logs go. The
point is evidence — next time a match keeps failing you have the audio's
characteristics on record instead of having to guess.
"""

from __future__ import annotations

import json
import logging
from typing import Iterable, Optional

from .models import AudioCharacteristics, MissRecord

_LOG = logging.getLogger("audio_reconciliation.miss")


class MissLog:
    """Collects :class:`MissRecord`s and mirrors them to a logger."""

    def __init__(self, logger: Optional[logging.Logger] = None) -> None:
        self._logger = logger or _LOG
        self._records: list[MissRecord] = []

    def log(
        self,
        *,
        session_id: str,
        audio_id: str,
        attempt_id: str,
        characteristics: AudioCharacteristics,
        reason: str,
        cluster_id: Optional[str] = None,
    ) -> MissRecord:
        record = MissRecord(
            session_id=session_id,
            audio_id=audio_id,
            attempt_id=attempt_id,
            characteristics=characteristics,
            reason=reason,
            cluster_id=cluster_id,
        )
        self._records.append(record)
        # A single structured line so log processors can index the fields.
        self._logger.info("catalog miss %s", json.dumps(record.as_dict(), sort_keys=True))
        return record

    # ---- querying the evidence -------------------------------------------

    def records(self) -> list[MissRecord]:
        return list(self._records)

    def for_audio(self, session_id: str, audio_id: str) -> list[MissRecord]:
        return [
            r
            for r in self._records
            if r.session_id == session_id and r.audio_id == audio_id
        ]

    def for_session(self, session_id: str) -> list[MissRecord]:
        return [r for r in self._records if r.session_id == session_id]

    def __len__(self) -> int:
        return len(self._records)


__all__ = ["MissLog"]
