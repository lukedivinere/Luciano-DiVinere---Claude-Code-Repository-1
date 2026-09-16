"""Inline-SVG sparklines from a numeric series.

Dependency-free and JS-free: renders a tiny <svg> polyline that embeds
directly in the HTML briefing. Trend color reuses the page's semantic
up/down tokens (via CSS classes) so it stays legible in light and dark.

Pure functions — fully unit-testable, no I/O.
"""

from __future__ import annotations

from typing import Sequence


def _trend_class(values: Sequence[float]) -> str:
    if len(values) < 2:
        return "flat"
    if values[-1] > values[0]:
        return "up"
    if values[-1] < values[0]:
        return "down"
    return "flat"


def build_svg(values: Sequence[float], width: int = 96, height: int = 24,
              pad: int = 2) -> str:
    """Return an inline SVG sparkline for `values`.

    - 0 values  -> "" (nothing to draw)
    - 1 value   -> a flat mid-line
    - N values  -> a polyline scaled to fit, plus a dot on the last point.

    The stroke color is set by a CSS class (spark up/down/flat) so it
    matches the report theme; a title gives an accessible tooltip.
    """
    n = len(values)
    if n == 0:
        return ""

    cls = _trend_class(values)
    inner_w = width - 2 * pad
    inner_h = height - 2 * pad

    if n == 1:
        y = pad + inner_h / 2
        pts = f"{pad},{y:.1f} {width - pad},{y:.1f}"
    else:
        lo, hi = min(values), max(values)
        span = (hi - lo) or 1.0  # avoid divide-by-zero on a flat series
        step = inner_w / (n - 1)
        coords = []
        for i, v in enumerate(values):
            x = pad + i * step
            # Invert y: higher value -> higher on screen (smaller y).
            y = pad + inner_h * (1 - (v - lo) / span)
            coords.append(f"{x:.1f},{y:.1f}")
        pts = " ".join(coords)

    last_x = width - pad
    last_y = float(pts.split()[-1].split(",")[1])
    title = f"{n}-point trend"

    return (
        f'<svg class="spark {cls}" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}" role="img" aria-label="{title}">'
        f"<title>{title}</title>"
        f'<polyline fill="none" stroke="currentColor" stroke-width="1.5" '
        f'stroke-linejoin="round" stroke-linecap="round" points="{pts}"/>'
        f'<circle cx="{last_x:.1f}" cy="{last_y:.1f}" r="2" fill="currentColor"/>'
        f"</svg>"
    )
