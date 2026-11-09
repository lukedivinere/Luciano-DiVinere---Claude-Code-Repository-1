# Picture prompts

## What was used

- **Model: GPT Image 2 (`gpt_image_2`), quality `medium`, 1k.** The plan was GPT Image 2.5 at high quality, but Higgsfield refuses GPT Image 2.5 and 2.6 on the free plan ("Requires basic plan or higher"). GPT Image 2 runs on the free plan; at high quality it costs 3.5 credits per picture, so medium (1 credit) was used to fit the 10 free credits.
- **Prompt format:** what it is + angle, then "lots of empty space around it, nothing touching the edges", then the style line word for word, then the list of things to leave out.
- **Background removal:** done with `../tools/cutout.py`, not Higgsfield. Higgsfield's remover costs 1 credit per picture, which would not have fit. Ink drawings on plain white cut out cleanly this way: outlined shapes stay crisp and fully opaque inside, and sides the prompt asked to fade (mountain bases, the leg, the cable ends) fade out softly. The original white-background pictures are kept in `raw/`.
- **Review:** every picture was checked for text, wrong colour, anything cut off at the edge, extra objects, and a style that doesn't match the others. All 7 passed on the first try, so nothing was remade. The script measures colour (all are neutral grey, 0% coloured pixels) and margins (at least 44 px clear of every edge).
- **Credits:** 7 used (1 per picture), 3 left. That's about $0.34 at Higgsfield's Plus price ($49 for 1,000 credits). Money actually paid: $0, since these were the free sign-up credits.

| Picture | Ratio | Pixels | Higgsfield job | Tries | Cut-out fade |
|---|---|---|---|---|---|
| `mountain_left.png` | 3:4 | 880 × 1168 | `92e8d63b-74f9-4652-989b-222dffd2df2f` | 1 | bottom 22% |
| `mountain_right.png` | 3:4 | 880 × 1168 | `8b980617-67c5-4371-93f2-2d2179c9efa1` | 1 | bottom 40%, right 12% |
| `clouds.png` | 16:9 | 1344 × 752 | `cbee90ab-f163-448e-8e95-86879197b1f9` | 1 | none |
| `walker.png` | 2:3 | 688 × 1024 | `eeec0923-82a5-4b31-a798-c40053e2a752` | 1 | none |
| `pole.png` | 21:9 | 1344 × 576 | `976bf63f-6248-44bb-8227-7df713881d0e` | 1 | none |
| `foot_on_wire.png` | 4:3 | 1168 × 880 | `c70fcbc1-caff-4f4d-9da4-3dfe00cc34ca` | 1 | top 35% |
| `wire_closeup.png` | 21:9 | 1344 × 576 | `920913e5-b1ea-41d2-bf4f-2c62d852bba4` | 1 | left 12%, right 12% |

Remake a cut-out (from `tightrope-video/`), e.g.:

```bash
python3 -I tools/cutout.py images/raw/mountain_right_v1.png images/mountain_right.png bottom:0.4 right:0.12
```

Notes for the animation step:
- The walker's arms came out nearer chest height than the waist height asked for. It was kept because both fists are level, so a straight horizontal pole sits through them.
- The pictures are 1k. The walker is 688 × 1024, so a close zoom on the head (shot 6) will look soft; upscale it or remake it at a higher resolution before that shot.

## mountain_left.png (3:4, tall)

A tall, rocky mountain peak with a sharp, pointed summit, seen from the side at eye level, its right side a steep cliff with a small flat rock ledge just below the summit, its base fading softly into the white at the bottom, lots of empty space around it, nothing touching the edges. Black and white scientific illustration, fine ink lines and soft graphite shading, like a page from an old textbook, single object isolated on a plain white background, no text, no labels, no color. Plain white background, no text, no labels, no numbers, no arrows, no shadows, no frame.

## mountain_right.png (3:4, tall)

A tall, rocky mountain peak with a broad, jagged summit, seen from the side at eye level, its left side a steep cliff with a small flat rock ledge just below the summit, its base fading softly into the white at the bottom, lots of empty space around it, nothing touching the edges. Black and white scientific illustration, fine ink lines and soft graphite shading, like a page from an old textbook, single object isolated on a plain white background, no text, no labels, no color. Plain white background, no text, no labels, no numbers, no arrows, no shadows, no frame.

## clouds.png (16:9, wide)

A single long, low bank of soft, wispy clouds, seen from the side at eye level, lots of empty space around it, nothing touching the edges. Black and white scientific illustration, fine ink lines and soft graphite shading, like a page from an old textbook, single object isolated on a plain white background, no text, no labels, no color. Plain white background, no text, no labels, no numbers, no arrows, no shadows, no frame.

## walker.png (2:3, tall)

A tightrope walker seen from directly behind, full figure from head to feet, walking away from the viewer mid-step, arms held out to both sides at waist height with elbows slightly bent, both hands closed at exactly the same height as if gripping a long horizontal pole, but the hands are empty and no pole, rope or wire is drawn, wearing plain fitted clothes and thin, soft slippers, lots of empty space around it, nothing touching the edges. Black and white scientific illustration, fine ink lines and soft graphite shading, like a page from an old textbook, single object isolated on a plain white background, no text, no labels, no color. Plain white background, no text, no labels, no numbers, no arrows, no shadows, no frame.

## pole.png (21:9, very wide)

A long, straight, thin wooden balancing pole lying perfectly horizontal, seen from the side, slightly thicker at two hand grips near the middle, lots of empty space around it, nothing touching the edges. Black and white scientific illustration, fine ink lines and soft graphite shading, like a page from an old textbook, single object isolated on a plain white background, no text, no labels, no color. Plain white background, no text, no labels, no numbers, no arrows, no shadows, no frame.

## foot_on_wire.png (4:3, a little wide)

A close-up of one human foot in a thin, soft leather slipper, seen from the side with the toes pointing right, the thin, flexible sole slightly curved underneath, the lower leg fading softly into the white just above the ankle, lots of empty space around it, nothing touching the edges. Black and white scientific illustration, fine ink lines and soft graphite shading, like a page from an old textbook, single object isolated on a plain white background, no text, no labels, no color. Plain white background, no text, no labels, no numbers, no arrows, no shadows, no frame.

## wire_closeup.png (21:9, very wide)

A short, straight, horizontal section of thick braided steel cable, seen from the side, its twisted strands clearly visible, both ends fading softly into the white, lots of empty space around it, nothing touching the edges. Black and white scientific illustration, fine ink lines and soft graphite shading, like a page from an old textbook, single object isolated on a plain white background, no text, no labels, no color. Plain white background, no text, no labels, no numbers, no arrows, no shadows, no frame.
