"""The catalog matcher interface plus a simple in-memory implementation.

The engine only depends on the ``CatalogMatcher`` protocol, so a real
deployment can drop in whatever fingerprint index it uses (an ANN service, a
managed ACR API, ...) without the reconciliation logic knowing or caring.
"""

from __future__ import annotations

from typing import Optional, Protocol, runtime_checkable

from .models import AudioCharacteristics, CatalogMatch, cosine_similarity


@runtime_checkable
class CatalogMatcher(Protocol):
    """Resolve audio characteristics to a catalog entry, or return ``None``."""

    def match(self, characteristics: AudioCharacteristics) -> Optional[CatalogMatch]:
        ...


class InMemoryCatalogMatcher:
    """Nearest-fingerprint matcher over an in-memory catalog.

    Intended for tests and small deployments. A catalog entry matches when the
    cosine similarity of its fingerprint to the query clears ``threshold``; the
    best-scoring entry wins and its score is reported as the match confidence.
    """

    def __init__(self, threshold: float = 0.9) -> None:
        self.threshold = threshold
        self._entries: list[tuple[CatalogMatch, tuple[float, ...]]] = []

    def add(
        self,
        catalog_id: str,
        fingerprint: tuple[float, ...],
        *,
        title: Optional[str] = None,
    ) -> None:
        self._entries.append(
            (CatalogMatch(catalog_id=catalog_id, confidence=0.0, title=title), tuple(fingerprint))
        )

    def match(self, characteristics: AudioCharacteristics) -> Optional[CatalogMatch]:
        best: Optional[CatalogMatch] = None
        best_score = self.threshold
        for entry, fp in self._entries:
            score = cosine_similarity(characteristics.fingerprint, fp)
            if score >= best_score:
                best_score = score
                best = CatalogMatch(
                    catalog_id=entry.catalog_id,
                    confidence=score,
                    title=entry.title,
                    metadata=dict(entry.metadata),
                )
        return best


__all__ = ["CatalogMatcher", "InMemoryCatalogMatcher"]
