"""Cut a helmet photo out of a plain white background for the hero helmet slot.

usage: python tools/prepare_helmet.py <helmet.png> [threshold]
Run from the `max` folder. Writes images/hero/max-helmet.webp (square, transparent).
"""
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src = sys.argv[1]
thr = float(sys.argv[2]) if len(sys.argv) > 2 else 7

im = Image.open(src).convert('RGB')
Image.open(src).save('images/src/max-helmet.png')
a = np.asarray(im).astype(np.float32)
h, w, _ = a.shape
dist = np.sqrt(((a - 255) ** 2).sum(axis=2))  # distance from pure white

# background = near-white pixels connected to the border
cand = Image.fromarray(((dist < thr) * 255).astype(np.uint8)).copy()
for x in range(w):
    for y in (0, h - 1):
        if cand.getpixel((x, y)) == 255:
            ImageDraw.floodfill(cand, (x, y), 128)
for y in range(h):
    for x in (0, w - 1):
        if cand.getpixel((x, y)) == 255:
            ImageDraw.floodfill(cand, (x, y), 128)
bg = np.asarray(cand) == 128

# keep the biggest solid shape: close small gaps, then fill any interior holes
fg = Image.fromarray(((~bg) * 255).astype(np.uint8))
fg = fg.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
holes = fg.copy()
ImageDraw.floodfill(holes, (0, 0), 128)
fgm = (np.asarray(fg) == 255) | (np.asarray(holes) == 0)

alpha = Image.fromarray((fgm * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.1))
rgba = np.dstack([a, np.asarray(alpha)]).astype(np.uint8)
out = Image.fromarray(rgba, 'RGBA')

# trim to the helmet, pad to a square with a little margin
bbox = out.getbbox()
out = out.crop(bbox)
side = int(max(out.size) * 1.04)
sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
sq.paste(out, ((side - out.width) // 2, (side - out.height) // 2), out)
sq.save('images/hero/max-helmet.webp', quality=92, method=6)
print('bbox', bbox, 'square', side)
