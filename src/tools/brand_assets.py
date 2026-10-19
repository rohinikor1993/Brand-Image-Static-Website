#!/usr/bin/env python3
"""
Make the web logo sizes, the browser / app icons and the social share image from the logo.

    python src/tools/guideline_logo.py "Colour palate/<guidelines image>.jpeg"   # writes the logo
    python src/tools/brand_assets.py site/assets/fonts/montserrat-latin-wght-normal.woff2

The logo (site/assets/img/brand/brand-image-logo.png, transparent) is only resized, always keeping
its proportions, and its colours stay exactly the logo's colours: after resizing, every pixel is
set back to the nearest of the logo's own colours (Brand Blue #2468B1, Brand Orange #F7A40A and the
tagline colour), so no in-between shades appear. The icons use the diamond mark on its own, the
way the guidelines show the app icon (the mark on white).
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
BRAND = os.path.join(ROOT, "site", "assets", "img", "brand")
SITE = os.path.join(ROOT, "site")
MASTER = os.path.join(BRAND, "brand-image-logo.png")

# Brand palette (client brand identity guidelines)
BLUE = (36, 104, 177)          # Brand Blue   #2468B1
DEEP_BLUE = (29, 85, 146)      # Deep Blue    #1D5592
ORANGE = (247, 164, 10)        # Brand Orange #F7A40A
DEEP_ORANGE = (217, 138, 0)    # Deep Orange  #D98A00
WHITE = (255, 255, 255)


def logo_colours(rgba):
    a = np.asarray(rgba)
    solid = a[a[..., 3] == 255][:, :3]
    cols, counts = np.unique(solid.reshape(-1, 3), axis=0, return_counts=True)
    return cols[counts > 50].astype(float)


def resize(rgba, size, colours):
    """Resize keeping the exact logo colours; crisp edges when making it larger."""
    a = np.asarray(rgba).astype(float)
    alpha = a[..., 3] / 255
    # give every clear pixel the colour of the nearest solid pixel, so edges do not darken
    idx = ndimage.distance_transform_edt(alpha < 0.5, return_indices=True)[1]
    rgb = a[..., :3][idx[0], idx[1]]
    w, h = size
    scale = w / rgba.width
    big_rgb = np.dstack([np.asarray(Image.fromarray(rgb[..., c].astype(np.float32), "F").resize(size, Image.LANCZOS)) for c in range(3)])
    big_a = np.asarray(Image.fromarray(alpha.astype(np.float32), "F").resize(size, Image.LANCZOS))
    if scale > 1.2:
        # enlarging: keep the edges about one pixel wide instead of blurred
        half = 0.5 / scale
        t = np.clip((big_a - (0.5 - half)) / (2 * half), 0, 1)
        big_a = t * t * (3 - 2 * t)
    big_a = np.clip(big_a, 0, 1)
    # every pixel back to the nearest logo colour
    d = ((big_rgb[:, :, None, :] - colours[None, None, :, :]) ** 2).sum(-1)
    snapped = colours[np.argmin(d, axis=2)]
    out = np.dstack([snapped, big_a * 255]).round().astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def mark_box(rgba):
    """The diamond mark: the artwork left of the first wide clear gap."""
    alpha = np.asarray(rgba)[..., 3]
    cols = (alpha > 20).any(axis=0)
    started, gap, end = False, 0, rgba.width
    for x, ink in enumerate(cols):
        if ink:
            started, gap = True, 0
        elif started:
            gap += 1
            if gap > 12:
                end = x - gap + 1
                break
    part = rgba.crop((0, 0, end, rgba.height))
    return part.crop(part.getbbox())


def square_icon(mark, size, colours, bg=None, padding=0.12):
    canvas = Image.new("RGBA", (size, size), bg + (255,) if bg else (0, 0, 0, 0))
    inner = int(round(size * (1 - 2 * padding)))
    s = inner / max(mark.width, mark.height)
    m = resize(mark, (max(1, round(mark.width * s)), max(1, round(mark.height * s))), colours)
    canvas.alpha_composite(m, ((size - m.width) // 2, (size - m.height) // 2))
    return canvas


def main(font_path):
    logo = Image.open(MASTER).convert("RGBA")
    colours = logo_colours(logo)
    print("logo", logo.size, "colours", ["#%02X%02X%02X" % tuple(int(v) for v in c) for c in colours])

    # Web logo sizes (transparent, lossless so the colours stay exact)
    for w in (360, 720):
        h = round(logo.height * w / logo.width)
        resize(logo, (w, h), colours).save(os.path.join(BRAND, f"brand-image-logo-{w}.webp"), "WEBP", lossless=True, quality=100, method=6)
    print("web logo sizes written")

    mark = mark_box(logo)
    print("mark", mark.size)
    square_icon(mark, 32, colours, padding=0.02).save(os.path.join(SITE, "favicon-32x32.png"))
    square_icon(mark, 16, colours, padding=0.0).save(os.path.join(SITE, "favicon-16x16.png"))
    square_icon(mark, 256, colours, padding=0.02).save(os.path.join(SITE, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])
    square_icon(mark, 180, colours, bg=WHITE, padding=0.14).convert("RGB").save(os.path.join(SITE, "apple-touch-icon.png"))
    square_icon(mark, 192, colours, bg=WHITE, padding=0.16).save(os.path.join(BRAND, "icon-192.png"))
    square_icon(mark, 512, colours, bg=WHITE, padding=0.16).save(os.path.join(BRAND, "icon-512.png"))
    # The mark on its own (the call-to-action ring and the faint watermarks)
    square_icon(mark, 400, colours, padding=0.0).save(os.path.join(BRAND, "brand-image-mark.png"), optimize=True)
    print("icons written")

    # Social share image (1200 x 630): the logo on white above a brand blue band
    og = Image.new("RGBA", (1200, 630), WHITE + (255,))
    lw = 820
    lh = round(logo.height * lw / logo.width)
    og.alpha_composite(resize(logo, (lw, lh), colours), ((1200 - lw) // 2, 150 + (200 - lh) // 2))
    d = ImageDraw.Draw(og)
    d.rectangle((0, 520, 1200, 630), fill=BLUE)
    d.rectangle((0, 512, 1200, 520), fill=ORANGE)
    font = ImageFont.truetype(font_path, 34)
    try:
        font.set_variation_by_axes([700])  # variable Montserrat: use the Bold weight
    except (OSError, NotImplementedError):
        pass  # a single-weight font file is used as it is
    text = "Advertising Agency in Nashik"
    tw = d.textlength(text, font=font)
    d.text(((1200 - tw) / 2, 553), text, font=font, fill=WHITE)
    og.convert("RGB").save(os.path.join(BRAND, "og-brand-image.jpg"), quality=90, optimize=True)
    print("share image written")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
