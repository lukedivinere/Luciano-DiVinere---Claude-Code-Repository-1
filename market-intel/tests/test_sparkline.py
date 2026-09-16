"""Tests for the inline-SVG sparkline renderer. Pure, no I/O."""

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import sparkline  # noqa: E402


def test_empty_series_returns_nothing():
    assert sparkline.build_svg([]) == ""


def test_single_point_is_flat_line():
    svg = sparkline.build_svg([100.0])
    assert "<svg" in svg and "polyline" in svg
    assert "spark flat" in svg
    # Two points at the same y (a flat mid-line).
    pts = re.search(r'points="([^"]+)"', svg).group(1).split()
    ys = {p.split(",")[1] for p in pts}
    assert len(ys) == 1


def test_uptrend_class_and_point_count():
    svg = sparkline.build_svg([1, 2, 3, 4, 5])
    assert "spark up" in svg
    pts = re.search(r'points="([^"]+)"', svg).group(1).split()
    assert len(pts) == 5


def test_downtrend_class():
    assert "spark down" in sparkline.build_svg([5, 4, 3, 2, 1])


def test_flat_series_does_not_crash():
    # All-equal values -> span guard prevents divide-by-zero.
    svg = sparkline.build_svg([3, 3, 3])
    assert "<svg" in svg and "spark flat" in svg


def test_coordinates_within_viewbox():
    w, h = 96, 24
    svg = sparkline.build_svg([10, 50, 20, 80, 40], width=w, height=h)
    pts = re.search(r'points="([^"]+)"', svg).group(1).split()
    for p in pts:
        x, y = map(float, p.split(","))
        assert 0 <= x <= w
        assert 0 <= y <= h


if __name__ == "__main__":
    passed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
            passed += 1
    print(f"\n{passed} test(s) passed.")
