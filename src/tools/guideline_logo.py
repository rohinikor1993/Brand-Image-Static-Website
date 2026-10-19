#!/usr/bin/env python3
"""
Cut the Brand Image logo out of the brand identity guidelines image (the "Colour palate" folder has
no separate logo file, only the guidelines picture).

    python src/tools/guideline_logo.py "Colour palate/<guidelines image>.jpeg"

The logo is not redrawn: every pixel of the result comes from the primary logo at the top left of
the guidelines. Only the light background is removed (made transparent) and the JPEG noise in the
flat colours is cleaned, so the blue is exactly Brand Blue #2468B1 and the orange exactly Brand
Orange #F7A40A (the colours the guidelines give for the logo); the tagline keeps its dark colour.
Writes site/assets/img/brand/brand-image-logo.png (full size, transparent); then run
src/tools/brand_assets.py to make the web sizes, the browser icons and the share image from it.
"""
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "site", "assets", "img", "brand", "brand-image-logo.png")

# Where the primary logo sits in the 1536 x 1024 guidelines image (below the "Brand identity
# guidelines" title, above the colour palette).
BOX = (50, 36, 790, 202)

BRAND_BLUE = (36, 104, 177)      # #2468B1
BRAND_ORANGE = (247, 164, 10)    # #F7A40A


def main(path):
    im = Image.open(path).convert("RGB")
    if im.size != (1536, 1024):
        # the positions above are for the guidelines image as sent (1536 x 1024)
        im = im.resize((1536, 1024), Image.LANCZOS)
    g = np.asarray(im.crop(BOX)).astype(float)
    h, w, _ = g.shape

    # Background: the light grey of the guidelines page around the logo
    border = np.concatenate([g[:3].reshape(-1, 3), g[-3:].reshape(-1, 3), g[:, :3].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    dist = np.linalg.norm(g - bg, axis=2)

    # The logo's colours as they appear in the image (measured on solid parts of each colour)
    solid = dist > 150
    r, gg, b = g[..., 0], g[..., 1], g[..., 2]
    is_blue = solid & (b > r + 80) & (gg > 60)
    is_orange = solid & (r > 200) & (b < 80)
    is_dark = (dist > 190) & ~is_blue & ~is_orange & (r + gg + b < 240)
    seen = {
        "blue": np.median(g[is_blue], axis=0),
        "orange": np.median(g[is_orange], axis=0),
        "dark": np.median(g[is_dark], axis=0),
    }
    # Colour written into the logo for each: exact brand blue and orange; the tagline keeps its own
    # colour (measured from its solid pixels)
    final = {
        "blue": np.array(BRAND_BLUE, float),
        "orange": np.array(BRAND_ORANGE, float),
        "dark": np.round(seen["dark"]),
    }
    print("background", bg.round(1), "| seen", {k: v.round(1).tolist() for k, v in seen.items()})
    print("tagline colour kept:", "#%02X%02X%02X" % tuple(int(c) for c in final["dark"]))

    # Each pixel is a mix of the background and one logo colour: find which colour and how much
    names = list(seen)
    alphas, resid = [], []
    for k in names:
        f = seen[k] - bg
        a = np.clip(((g - bg) @ f) / (f @ f), 0, 1)
        fit = bg + a[..., None] * f
        alphas.append(a)
        resid.append(np.linalg.norm(g - fit, axis=2))
    alphas = np.stack(alphas)
    best = np.argmin(np.stack(resid), axis=0)
    alpha = np.take_along_axis(alphas, best[None], 0)[0]
    alpha[alpha < 0.06] = 0
    alpha[alpha > 0.94] = 1

    rgb = np.zeros((h, w, 3))
    for i, k in enumerate(names):
        rgb[best == i] = final[k]

    # Drop specks of JPEG noise (tiny islands far from the artwork)
    from collections import deque
    on = alpha > 0
    seen_px = np.zeros_like(on)
    for y0 in range(h):
        for x0 in range(w):
            if not on[y0, x0] or seen_px[y0, x0]:
                continue
            comp, q = [], deque([(y0, x0)])
            seen_px[y0, x0] = True
            while q:
                y, x = q.popleft()
                comp.append((y, x))
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        yy, xx = y + dy, x + dx
                        if 0 <= yy < h and 0 <= xx < w and on[yy, xx] and not seen_px[yy, xx]:
                            seen_px[yy, xx] = True
                            q.append((yy, xx))
            if len(comp) < 8 and max(alpha[p] for p in comp) < 0.5:
                for p in comp:
                    alpha[p] = 0

    out = np.dstack([rgb, alpha * 255]).round().astype(np.uint8)
    logo = Image.fromarray(out, "RGBA")
    logo = logo.crop(logo.getbbox())
    # a little clear space around the artwork
    pad = 4
    canvas = Image.new("RGBA", (logo.width + 2 * pad, logo.height + 2 * pad), (0, 0, 0, 0))
    canvas.paste(logo, (pad, pad))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    canvas.save(OUT, optimize=True)
    print("logo written:", OUT, canvas.size)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
