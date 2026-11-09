#!/usr/bin/env python3
"""Cut an ink-and-graphite drawing out of its plain white background.

Usage:
    python3 -I cutout.py INPUT.png OUTPUT.png [SIDE:SHARE ...]

    SIDE:SHARE adds a soft fade-out on one side for drawings whose prompt
    asks for a fade, e.g. "bottom:0.22" fades the lowest 22% of the object.
    Sides: top, bottom, left, right.

Prints a short report (paper level, colour tint, margins to the edges,
number of separate pieces) that is used to review each picture.

How it works:
  1. The paper white level is measured on the image border.
  2. The background is every near-white pixel connected to the border.
     Dark lines are thickened by a couple of pixels first, so the fill
     cannot leak through tiny gaps into the object.
  3. Everything inside the object stays fully opaque (white shirts,
     highlights, cloud interiors), so layers do not show through each other.
  4. Faint grey left in the background (soft edges, graphite fades) becomes
     semi-transparent ink, and edge colours are "un-mixed" from the white,
     so the cut-out looks identical over white and has no white fringe
     over anything darker.

Requires: pillow, numpy, scipy.
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

NEAR_WHITE = 18      # levels below paper white that still count as background
GAP = 2              # px: line gaps narrower than ~2*GAP are sealed
INK = 40.0           # grey level used for semi-transparent background ink
MIN_SPECK = 40       # px: object pieces smaller than this are treated as dust
SOFTEN = 6.0         # px: blur used to dissolve the cut line inside a fade


def cutout(src, dst, fades=()):
    rgb = np.asarray(Image.open(src).convert("RGB")).astype(np.float64)
    h, w, _ = rgb.shape
    lum = rgb @ np.array([0.299, 0.587, 0.114])

    edge = np.concatenate([lum[0], lum[-1], lum[:, 0], lum[:, -1]])
    paper = float(np.median(edge))
    near_white = lum >= paper - NEAR_WHITE

    # Background = near-white region connected to the border (gaps sealed).
    sealed = ndimage.binary_erosion(near_white, iterations=GAP, border_value=1)
    labels, _ = ndimage.label(sealed)
    border_ids = np.unique(np.concatenate(
        [labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    border_ids = border_ids[border_ids > 0]
    background = np.isin(labels, border_ids)
    background = ndimage.binary_dilation(background, iterations=GAP) & near_white

    # Drop tiny specks of dust that are not part of the drawing.
    obj = ~background
    labels, n = ndimage.label(obj)
    sizes = ndimage.sum(obj, labels, index=np.arange(1, n + 1))
    for i, size in enumerate(sizes, start=1):
        if size < MIN_SPECK:
            obj[labels == i] = False

    # Alpha: ink coverage everywhere, the object itself opaque, and its
    # outermost pixel ring following the ink (so there is no light rim).
    alpha_ink = np.clip((paper - lum) / (paper - INK), 0, 1)
    alpha = alpha_ink.copy()
    alpha[obj] = 1.0
    rim = obj & (ndimage.distance_transform_edt(obj) <= 1.0)
    alpha[rim] = alpha_ink[rim]

    # Small opaque islands cut loose from the main shape fall back to ink.
    solid = alpha > 0.5
    labels, n = ndimage.label(solid)
    if n > 1:
        sizes = ndimage.sum(solid, labels, index=np.arange(1, n + 1))
        for i, size in enumerate(sizes, start=1):
            if size < 0.01 * sizes.max():
                island = labels == i
                alpha[island] = alpha_ink[island]

    # Sides the prompt asked to fade out (e.g. a mountain's base) get a
    # smooth ramp over that share of the object's height or width.
    ys, xs = np.nonzero(alpha > 0.05)
    if len(xs):
        y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
        yy, xx = np.mgrid[0:h, 0:w]
        ramp = np.ones_like(alpha)
        for side, share in fades:
            if side in ("top", "bottom"):
                span = max(1.0, share * (y1 - y0))
                d = (yy - y0) if side == "top" else (y1 - yy)
            else:
                span = max(1.0, share * (x1 - x0))
                d = (xx - x0) if side == "left" else (x1 - xx)
            t = np.clip(d / span, 0, 1)
            ramp = np.minimum(ramp, t * t * (3 - 2 * t))
        # Inside the fade, blend toward a blurred copy so the cut line
        # dissolves into a soft gradient instead of a jagged edge.
        soft = ndimage.gaussian_filter(alpha, SOFTEN)
        w_sharp = ramp ** 3
        alpha = np.maximum(alpha_ink, ramp * (w_sharp * alpha + (1 - w_sharp) * soft))
    alpha[alpha < 0.01] = 0.0

    # Un-mix the white paper from edge colours: I = a*F + (1-a)*paper.
    safe = np.maximum(alpha, 1e-3)[..., None]
    fg = np.clip((rgb - (1.0 - alpha[..., None]) * paper) / safe, 0, 255)
    fg[alpha == 0] = 0

    out = np.dstack([fg, alpha * 255.0]).round().astype(np.uint8)
    Image.fromarray(out, "RGBA").save(dst, optimize=True)

    # ---- report used for the review ----
    chroma = rgb.max(axis=2) - rgb.min(axis=2)
    drawn = lum < paper - NEAR_WHITE
    ys, xs = np.nonzero(alpha > 0.05)
    pieces_mask = alpha > 0.5
    plabels, pn = ndimage.label(pieces_mask)
    psizes = np.sort(ndimage.sum(pieces_mask, plabels, index=np.arange(1, pn + 1)))[::-1]
    big = [int(s) for s in psizes if s >= 0.01 * psizes[0]] if pn else []
    print(f"{src} -> {dst}")
    print(f"  size {w}x{h}, paper white {paper:.0f}/255")
    print(f"  colour: mean chroma {chroma[drawn].mean() if drawn.any() else 0:.1f}, "
          f"pixels with chroma>20: {100 * (chroma > 20).mean():.2f}%")
    if len(xs):
        print(f"  margins px: left {xs.min()}, right {w - 1 - xs.max()}, "
              f"top {ys.min()}, bottom {h - 1 - ys.max()}")
    print(f"  pieces (>=1% of largest): {len(big)} {big[:6]}")
    print(f"  opaque coverage {100 * (alpha > 0.5).mean():.1f}% of canvas")


if __name__ == "__main__":
    args = sys.argv[1:]
    if len(args) < 2:
        sys.exit(__doc__)
    fade_args = []
    for spec in args[2:]:               # e.g. bottom:0.22  left:0.15
        side, share = spec.split(":")
        if side not in ("top", "bottom", "left", "right"):
            sys.exit(f"unknown side {side!r}")
        fade_args.append((side, float(share)))
    cutout(args[0], args[1], fade_args)
