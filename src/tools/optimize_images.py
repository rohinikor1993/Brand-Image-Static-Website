#!/usr/bin/env python3
"""
Build responsive WebP images for the Brand Image website.

Usage:
    python src/tools/optimize_images.py "<old-site-backup>/assets/img"

Requires Pillow (pip install pillow). Reads the list in images_manifest.py,
writes <out>-<width>.webp files into site/assets/img/ and refreshes
src/content/images.json (dimensions + available widths) for the page builder.
"""
import json
import os
import sys

from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
from images_manifest import IMAGES, WIDTHS  # noqa: E402

OUT_DIR = os.path.join(ROOT, "site", "assets", "img")
JSON_OUT = os.path.join(ROOT, "src", "content", "images.json")

# Hand-picked square crops (left, top, right, bottom) for portrait photos.
SQUARE_CROPS = {
    "person-sureka": (255, 20, 675, 440),
}


def load(path):
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGB")
    if im.mode == "RGBA":
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[3])
        im = bg
    return im


def main(src_root):
    manifest = {}
    for item in IMAGES:
        src = os.path.join(src_root, item["src"])
        im = load(src)
        if item.get("crop"):
            l, t, r, b = item["crop"]
            im = im.crop((round(l * im.width), round(t * im.height), round(r * im.width), round(b * im.height)))
        if item["key"] in SQUARE_CROPS:
            im = im.crop(SQUARE_CROPS[item["key"]])
        elif item.get("crop_square") or item["key"].startswith("person-"):
            s = min(im.size)
            left = (im.width - s) // 2
            im = im.crop((left, 0, left + s, s))
        widths = item.get("widths", WIDTHS)
        # Skip widths that are within 10% of the original (no visible gain).
        usable = [w for w in widths if w < im.width * 0.9]
        if im.width <= max(widths):
            usable.append(im.width)  # keep the native size as the largest variant
        else:
            usable.append(max(widths))
        usable = sorted(set(usable))
        out_base = os.path.join(OUT_DIR, item["out"])
        os.makedirs(os.path.dirname(out_base), exist_ok=True)
        for w in usable:
            h = round(im.height * w / im.width)
            resized = im.resize((w, h), Image.LANCZOS) if w != im.width else im
            resized.save(f"{out_base}-{w}.webp", "WEBP", quality=78, method=6)
        manifest[item["key"]] = {
            "path": "assets/img/" + item["out"],
            "widths": usable,
            "width": im.width,
            "height": im.height,
            "alt": item["alt"],
            "focal": item.get("focal", "50% 50%"),
            "category": item.get("category"),
        }
        print(f"{item['key']:28s} {im.width}x{im.height} -> {usable}")
    os.makedirs(os.path.dirname(JSON_OUT), exist_ok=True)
    with open(JSON_OUT, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)
    print(f"\nWrote {len(manifest)} images to {JSON_OUT}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
