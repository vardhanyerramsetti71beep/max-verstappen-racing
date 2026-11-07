"""Turn the two source photos into the site's image slots.

usage: python tools/prepare_photos.py <portrait.jpg> <car.jpg>
Run from the `max` folder. Writes into images/.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

portrait_src, car_src = sys.argv[1], sys.argv[2]
os.makedirs('images/src', exist_ok=True)
for d in ('hero', 'car', 'social'):
    os.makedirs(f'images/{d}', exist_ok=True)

# keep the originals with the project
Image.open(portrait_src).convert('RGB').save('images/src/max-portrait.jpg', quality=95)
Image.open(car_src).convert('RGB').save('images/src/rb18-studio.jpg', quality=95)

# ---------------------------------------------------------------- portrait cut-out
im = Image.open(portrait_src).convert('RGB')
a = np.asarray(im).astype(np.float32)
h, w, _ = a.shape
border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
bg = np.median(border, axis=0)
dist = np.sqrt(((a - bg) ** 2).sum(axis=2))

# background = near-bg pixels connected to the image border
cand = Image.fromarray(((dist < 20) * 255).astype(np.uint8)).copy()  # copy: array-backed images ignore floodfill
for x in range(0, w, 4):
    for y in (0, h - 1):
        if cand.getpixel((x, y)) == 255:
            ImageDraw.floodfill(cand, (x, y), 128)
for y in range(0, h, 4):
    for x in (0, w - 1):
        if cand.getpixel((x, y)) == 255:
            ImageDraw.floodfill(cand, (x, y), 128)
bgmask = np.asarray(cand) == 128
fg = ~bgmask

# soft edge: in a thin band outside the subject, alpha follows colour distance (keeps hair wisps)
fg_img = Image.fromarray((fg * 255).astype(np.uint8))
band = (np.asarray(fg_img.filter(ImageFilter.MaxFilter(7))) > 0) & bgmask
alpha = fg.astype(np.float32)
alpha[band] = np.clip((dist[band] - 6) / 26, 0, 1)
alpha_img = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.8))
alpha_arr = np.asarray(alpha_img).astype(np.float32) / 255
alpha_arr = np.where(fg, np.maximum(alpha_arr, .0), alpha_arr)
alpha_arr[np.asarray(fg_img.filter(ImageFilter.MinFilter(5))) > 0] = 1  # solid interior

# remove the grey cast from semi-transparent edge pixels
rgb = a.copy()
m = (alpha_arr > 0) & (alpha_arr < 1)
k = alpha_arr[m][:, None]
rgb[m] = np.clip((a[m] - bg * (1 - k)) / np.maximum(k, .15), 0, 255)

rgba = np.dstack([rgb, alpha_arr * 255]).astype(np.uint8)
cut = Image.fromarray(rgba, 'RGBA')
# 4:5 crop centred on the subject (head centre ≈ x 985 in the 2000 px source)
cx = int(w * 0.5025)
cw = int(h * 0.8)
left = max(0, min(w - cw, cx - cw // 2))
cut.crop((left, 0, left + cw, h)).save('images/hero/max-face.webp', quality=92, method=6)
print('hero cut-out crop left =', left, 'width =', cw)

# social card (9:16) from the portrait, with its studio background
ph = Image.open(portrait_src).convert('RGB')
sw = int(ph.height * 9 / 16)
ph.crop((985 - sw // 2, 0, 985 - sw // 2 + sw, ph.height)).save('images/social/s2.webp', quality=88)

# ---------------------------------------------------------------- car
car = Image.open(car_src).convert('RGB')
car.save('images/car/rb18-studio.webp', quality=88, method=6)
cw2 = int(car.height * 9 / 16)
car.crop((700, 0, 700 + cw2, car.height)).save('images/social/s4.webp', quality=88)
print('done')
