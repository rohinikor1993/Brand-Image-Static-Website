#!/usr/bin/env python3
"""
Build the home-page slider images from the banners in "Slider images/".

Usage (from the project folder; needs:  pip install pillow numpy):
    python src/tools/hero_banners.py
    npm run build

The banners are used as they are: no filters, fades or other effects. For every service it:
  * takes "Slider images/<service>.png" (printing, shop-branding, outdoor, transit,
    wall-painting, events, promotional; .jpg, .jpeg or .webp also work),
  * brings it to exactly 1920 x 820 px (a banner only a few pixels smaller or larger is
    padded or trimmed at the edge, not resized, so it stays sharp),
  * saves responsive WebP copies used on tablets and computers (the full banner),
  * cuts out the photo and the round inset on a transparent background, used on phones
    (where the slide text is shown as real, readable text below the picture) and at the
    top of that service's own page,
  * finds the "Explore ..." and "Get a Quote" buttons drawn in the banner, so the
    website can make them clickable,
  * takes out the top line ("— BRAND IMAGE MEDIA PVT LTD — PRINTING, BRANDING ...") that is
    drawn in every banner at a slightly different place, and records where it usually is:
    the website shows that line once, as real text, in the same spot on every slide, so it
    never moves when the slides change,
  * corrects known spelling mistakes drawn in a banner (see FIXES; only in the website copy,
    the file in "Slider images" is not changed),
and writes what the website needs to src/content/hero-banners.json.

To change a banner: replace its image in "Slider images" (same file name, same layout:
text and buttons on the left, photo with a round inset on the right), run this tool,
then rebuild the site.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC_DIR = os.path.join(ROOT, "Slider images")
OUT_DIR = os.path.join(ROOT, "site", "assets", "img", "hero")
JSON_OUT = os.path.join(ROOT, "src", "content", "hero-banners.json")
WEB_PATH = "assets/img/hero"

# service keys (src/content/services.json): the banner for each is "Slider images/<key>.png"
KEYS = ["printing", "shop-branding", "outdoor", "transit", "wall-painting", "events", "promotional"]
EXTS = (".png", ".jpg", ".jpeg", ".webp")

# Spelling mistakes drawn in a banner, corrected in the website copy only. Each correction is a
# small picture of that spot before and after (in src/tools/image-fixes/); it is applied only
# while the banner still shows the mistake there, so a new or different image is never touched.
FIX_DIR = os.path.join(HERE, "image-fixes")
FIXES = {
    "printing": [{"what": "'yourl srand' -> 'your brand'", "file": "printing-your-brand", "x": 249, "y": 555}],
}

W, H = 1920, 820                      # every banner is brought to this size
DESKTOP_WIDTHS = [960, 1280, 1600, 1920]
PHONE_W, PHONE_H = 1080, 720          # transparent canvas for the phone picture
PHONE_WIDTHS = [480, 800, 1080]
QUALITY = 80


# ------------------------------------------------------------------ helpers
def channels(img):
    a = np.asarray(img.convert("RGB")).astype(np.int16)
    return a[..., 0], a[..., 1], a[..., 2]


def is_background(R, G, B):
    """The blue gradient behind the banner text."""
    return (B > 110) & (B > R + 50) & (B > G + 10)


def components(mask, step=2):
    """Connected groups of True pixels (on a mask sampled every `step` px).
    Returns [(pixel_count, (x0, y0, x1, y1)), ...] in full-size coordinates."""
    m = mask[::step, ::step].copy()
    h, w = m.shape
    out = []
    ys, xs = np.nonzero(m)
    for sy, sx in zip(ys, xs):
        if not m[sy, sx]:
            continue
        stack = [(sy, sx)]
        m[sy, sx] = False
        n, x0, y0, x1, y1 = 0, sx, sy, sx, sy
        while stack:
            y, x = stack.pop()
            n += 1
            x0, x1, y0, y1 = min(x0, x), max(x1, x), min(y0, y), max(y1, y)
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < h and 0 <= nx < w and m[ny, nx]:
                    m[ny, nx] = False
                    stack.append((ny, nx))
        out.append((n * step * step, (x0 * step, y0 * step, x1 * step + step - 1, y1 * step + step - 1)))
    return out


# ------------------------------------------------------------------ steps
def find_source(key):
    for ext in EXTS:
        for name in (key + ext, key + ext.upper()):
            path = os.path.join(SRC_DIR, name)
            if os.path.exists(path):
                return path
    return None


def apply_fixes(key, img):
    """Correct known spelling mistakes (see FIXES) in the website copy of a banner."""
    img = img.convert("RGB")
    for fix in FIXES.get(key, []):
        before = Image.open(os.path.join(FIX_DIR, fix["file"] + "-before.png")).convert("RGB")
        after = Image.open(os.path.join(FIX_DIR, fix["file"] + "-after.png")).convert("RGB")
        box = (fix["x"], fix["y"], fix["x"] + before.width, fix["y"] + before.height)
        if box[2] <= img.width and box[3] <= img.height:
            now = np.asarray(img.crop(box)).astype(np.int16)
            if np.abs(now - np.asarray(before).astype(np.int16)).mean() < 4:
                img.paste(after, box[:2])
                print(f"   corrected the spelling {fix['what']} (website copy only)")
                continue
        print(f"   spelling correction {fix['what']} not needed: this image is different")
    return img


def normalize(img):
    """Bring the banner to exactly W x H. A banner only a few pixels off is padded (repeating its
    edge pixels) or trimmed at the right/bottom edge, never resized; otherwise it is scaled and
    trimmed, cutting background rather than content."""
    img = img.convert("RGB")
    w, h = img.size
    if abs(w - W) <= 16 and abs(h - H) <= 16:
        a = np.asarray(img)
        if w < W:
            a = np.concatenate([a, np.repeat(a[:, -1:], W - w, axis=1)], axis=1)
        if h < H:
            a = np.concatenate([a, np.repeat(a[-1:], H - h, axis=0)], axis=0)
        top = (a.shape[0] - H) // 2
        return Image.fromarray(np.ascontiguousarray(a[top: top + H, :W]))
    R, G, B = channels(img)
    white = (R > 220) & (G > 220) & (B > 220)
    top_text = int(np.nonzero(white[:, : int(w * .6)].any(axis=1))[0].min())
    if w / h > W / H:  # wider: trim width, mostly from the right (background beside the photo)
        s = H / h
        nw = round(w * s)
        excess = nw - W
        band = (~is_background(R, G, B))[int(h * .35): int(h * .65)].mean(axis=0)
        photo_right = np.nonzero(band > .6)[0].max() * s
        cut_r = min(excess, max(0, round(nw - photo_right - 64)))
        cut_l = excess - cut_r
        big = img.resize((nw, H), Image.LANCZOS)
        return big.crop((cut_l, 0, nw - cut_r, H))
    s = W / w       # taller (or equal): trim height, keeping space above the top line
    nh = round(h * s)
    excess = nh - H
    cut_t = min(round(excess / 2), max(0, round(top_text * s - 32)))
    big = img.resize((W, nh), Image.LANCZOS)
    return big.crop((0, cut_t, W, cut_t + H))


def find_explore_button(R, G, B):
    """The filled orange button, bottom-left quarter of the banner."""
    orange = (R > 215) & (G > 110) & (G < 215) & (B < 120)
    orange[:, int(W * .5):] = False
    orange[: int(H * .45)] = False
    best = None
    for n, (x0, y0, x1, y1) in components(orange):
        bw, bh = x1 - x0 + 1, y1 - y0 + 1
        if x0 <= 4 or y1 >= H - 4:          # the orange shape in the corner
            continue
        if bw >= 200 and 40 <= bh <= 120 and n / (bw * bh) > .45:
            if best is None or n > best[0]:
                best = (n, (x0, y0, x1, y1))
    if not best:
        raise ValueError("could not find the orange 'Explore' button")
    return [int(v) for v in best[1]]


def find_quote_button(R, G, B, explore, circle):
    """The outlined 'Get a Quote' button to the right of the orange button."""
    ex0, ey0, ex1, ey1 = explore
    y0, y1, x0, x1 = ey0 - 14, ey1 + 14, ex1 + 6, min(W, ex1 + 470, circle[0] - 10)
    light = ((R + G + B) / 3 > 125) & (B > 140)
    reg = light[y0:y1, x0:x1]
    rows = np.nonzero(reg.sum(axis=1) > 120)[0]
    if len(rows) >= 2:
        top, bot = y0 + rows.min(), y0 + rows.max()
        xs = np.nonzero(light[top - 1: top + 2, x0:x1].any(axis=0))[0]
        runs, start = [], xs[0]
        for p, q in zip(xs, xs[1:]):
            if q != p + 1:
                runs.append((start, p))
                start = q
        runs.append((start, xs[-1]))
        a, b = max(runs, key=lambda r: r[1] - r[0])
        # a border line can be broken by a highlight; also look for the vertical border lines
        cols = np.nonzero(light[top + 6: bot - 6, x0:x1].mean(axis=0) > .7)[0]
        if len(cols):
            a, b = min(a, cols.min()), max(b, cols.max())
        if b - a > 120:
            return [int(x0 + a), int(top), int(x0 + b), int(bot)]
    print("   ! 'Get a Quote' outline not found, using the usual position next to the orange button")
    return [ex1 + 24, ey0, ex1 + 24 + 230, ey1]


def fit_circle(pts, rmin, rmax, tol=2.5, tries=6000, seed=5):
    """Circle (cx, cy, r) through the most points (RANSAC, then least squares on those points).
    Points far from the circle, such as orange things in a photo, are ignored."""
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, len(pts), (tries, 3))
    p1, p2, p3 = pts[idx[:, 0]], pts[idx[:, 1]], pts[idx[:, 2]]
    ax, ay, bx, by, cx, cy = p1[:, 0], p1[:, 1], p2[:, 0], p2[:, 1], p3[:, 0], p3[:, 1]
    d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
    good = np.abs(d) > 1e-6
    d = np.where(good, d, 1)
    ux = ((ax ** 2 + ay ** 2) * (by - cy) + (bx ** 2 + by ** 2) * (cy - ay) + (cx ** 2 + cy ** 2) * (ay - by)) / d
    uy = ((ax ** 2 + ay ** 2) * (cx - bx) + (bx ** 2 + by ** 2) * (ax - cx) + (cx ** 2 + cy ** 2) * (bx - ax)) / d
    r = np.hypot(ax - ux, ay - uy)
    good &= (r >= rmin) & (r <= rmax)
    best, best_n = None, 0
    for k in np.nonzero(good)[0]:
        n = int((np.abs(np.hypot(pts[:, 0] - ux[k], pts[:, 1] - uy[k]) - r[k]) < tol).sum())
        if n > best_n:
            best, best_n = (ux[k], uy[k], r[k]), n
    if best is None:
        return None, 0
    for _ in range(3):  # refine: least-squares circle through the points close to it
        on = np.abs(np.hypot(pts[:, 0] - best[0], pts[:, 1] - best[1]) - best[2]) < tol
        x, y = pts[on, 0], pts[on, 1]
        A = np.stack([x, y, np.ones_like(x)], 1)
        c, *_ = np.linalg.lstsq(A, x ** 2 + y ** 2, rcond=None)
        ccx, ccy = c[0] / 2, c[1] / 2
        best = (ccx, ccy, float(np.sqrt(c[2] + ccx ** 2 + ccy ** 2)))
    on = np.abs(np.hypot(pts[:, 0] - best[0], pts[:, 1] - best[1]) - best[2]) < tol
    return best, int(on.sum())


def find_circle(R, G, B, explore):
    """Bounding box of the round inset: a circle fitted to the outer edge of its orange ring
    (orange things in the photos that touch the ring, like a road line, do not matter)."""
    orange = (R > 215) & (G > 110) & (G < 215) & (B < 120)
    orange[:, : int(W * .3)] = False
    orange[:, int(W * .72):] = False
    orange[: int(H * .3)] = False
    ex0, ey0, ex1, ey1 = explore
    orange[max(0, ey0 - 6): ey1 + 6, max(0, ex0 - 6): ex1 + 6] = False
    pts = []
    for y in np.nonzero(orange.any(axis=1))[0]:            # outermost orange pixels, row by row
        xs = np.nonzero(orange[y])[0]
        pts += [(xs[0], y), (xs[-1], y)]
    for x in np.nonzero(orange.any(axis=0))[0]:            # ... and column by column
        ys = np.nonzero(orange[:, x])[0]
        pts += [(x, ys[0]), (x, ys[-1])]
    pts = np.array(pts, float)
    circle, n = fit_circle(pts, rmin=H * .12, rmax=H * .3) if len(pts) >= 3 else (None, 0)
    if circle is None or n < 2.5 * circle[2]:            # at least ~40% of the ring's edge
        raise ValueError("could not find the round inset")
    cx, cy, r = circle
    return [int(round(cx - r)), int(round(cy - r)), int(round(cx + r)), int(round(cy + r))]


def find_photo(R, G, B, circle):
    """Edges of the main photo: the outermost straight lines where the plain background
    stops and the photo starts. (A straight edge shows a clear change of colour in almost
    every row or column along it; the background just outside it is the plain blue.)"""
    gx = (np.abs(np.diff(R, axis=1)) + np.abs(np.diff(G, axis=1)) + np.abs(np.diff(B, axis=1))).astype(np.float32)
    gy = (np.abs(np.diff(R, axis=0)) + np.abs(np.diff(G, axis=0)) + np.abs(np.diff(B, axis=0))).astype(np.float32)
    bg = (B > R + 40) & (B > G + 20)                     # blue background, including its darker shadow
    cx0, cy0, cx1, cy1 = circle
    rows = slice(int(H * .2), int(cy0 - 20))            # above the round inset

    def scan(prof, candidates, outside):
        thr = .35 * max(prof[c] for c in candidates)
        for c in candidates:
            if prof[c] >= thr and outside(c) > .6:
                return c
        return None

    prof = np.median(gx[rows], axis=0)
    left = scan(prof, range(int(W * .42), int(W * .62)), lambda x: bg[rows, max(0, x - 8): x + 1].mean())
    right = scan(prof, range(W - 2, int(W * .8), -1), lambda x: bg[rows, x + 1: x + 10].mean() if x + 1 < W else 1)
    if left is None or right is None:
        raise ValueError("could not find the photo's left/right edges")
    left += 1
    span = right - left
    cols = slice(int(left + span * .12), int(right - span * .12))
    prof = np.median(gy[:, cols], axis=1)
    top = scan(prof, range(int(H * .02), int(H * .35)), lambda y: bg[max(0, y - 8): y + 1, cols].mean())
    if top is None:
        raise ValueError("could not find the photo's top edge")
    top += 1
    cols = slice(int(max(cx1 + 20, left + span * .12)), int(right - span * .12))
    prof = np.median(gy[:, cols], axis=1)
    bottom = scan(prof, range(H - 2, int(H * .7), -1), lambda y: bg[y + 1: y + 10, cols].mean())
    if bottom is None:
        bottom = H - 1                                   # the photo runs to the bottom of the banner
    return [int(left), int(top), int(right), int(bottom)]


def phone_picture(img, photo, circle, radius=30):
    """Photo + round inset on a transparent canvas (PHONE_W x PHONE_H)."""
    pad = 4
    x0 = min(photo[0], circle[0]) - pad
    y0 = min(photo[1], circle[1]) - pad
    x1 = max(photo[2], circle[2]) + pad
    y1 = max(photo[3], circle[3]) + pad
    ss = 4  # draw the mask 4x larger for smooth edges
    mask = Image.new("L", ((x1 - x0) * ss, (y1 - y0) * ss), 0)
    d = ImageDraw.Draw(mask)
    inset = 2  # stay just inside the detected edges
    d.rounded_rectangle([((photo[0] - x0) + inset) * ss, ((photo[1] - y0) + inset) * ss,
                         ((photo[2] - x0) - inset) * ss, ((photo[3] - y0) - inset) * ss],
                        radius=radius * ss, fill=255)
    d.ellipse([((circle[0] - x0) + 1) * ss, ((circle[1] - y0) + 1) * ss,
               ((circle[2] - x0) - 1) * ss, ((circle[3] - y0) - 1) * ss], fill=255)
    mask = mask.resize((x1 - x0, y1 - y0), Image.LANCZOS)
    cut = img.crop((x0, y0, x1, y1)).convert("RGBA")
    cut.putalpha(mask)
    scale = min(PHONE_W / cut.width, PHONE_H / cut.height)
    cut = cut.resize((round(cut.width * scale), round(cut.height * scale)), Image.LANCZOS)
    canvas = Image.new("RGBA", (PHONE_W, PHONE_H), (0, 0, 0, 0))
    canvas.alpha_composite(cut, ((PHONE_W - cut.width) // 2, (PHONE_H - cut.height) // 2))
    return canvas


def find_top_line(R, G, B):
    """The line at the top of the banner: a short orange dash followed by the company name in
    white capitals. Returns (dash box, text box, text colour, dash colour) or None."""
    orange = (R > 200) & (G > 120) & (G < 215) & (B < 120)
    area = np.zeros_like(orange)
    area[6:140, 12:260] = True
    dash = None
    for n, (x0, y0, x1, y1) in components(orange & area, step=1):
        bw, bh = x1 - x0 + 1, y1 - y0 + 1
        if 24 <= bw <= 100 and 2 <= bh <= 10 and (dash is None or bw > dash[2] - dash[0]):
            dash = (x0, y0, x1, y1)
    if not dash:
        return None
    dx0, dy0, dx1, dy1 = dash
    cy = (dy0 + dy1) // 2
    y0, y1 = max(0, cy - 18), cy + 19
    light = R[y0:y1] > 60                       # the background is dark blue: its red is close to 0
    cols = np.nonzero(light[:, dx1 + 3: int(W * .75)].any(axis=0))[0] + dx1 + 3
    if not len(cols):
        return None
    # the text runs from the first light column up to the first gap wider than 70 px
    end = cols[0]
    for c in cols[1:]:
        if c - end > 70:
            break
        end = c
    tx0, tx1 = int(cols[0]), int(end)
    rows = np.nonzero(light[:, tx0 - y0 * 0: tx1 + 1].any(axis=1))[0] + y0
    counts = light[:, tx0: tx1 + 1].sum(axis=1)
    core = np.nonzero(counts > counts.max() * .25)[0] + y0       # capital letters, without comma tails
    text = (tx0, int(core.min()), tx1, int(core.max()))
    a = np.stack([R, G, B], axis=-1)
    tpix = a[text[1]: text[3] + 1, tx0: tx1 + 1][R[text[1]: text[3] + 1, tx0: tx1 + 1] > 200]
    dpix = a[dy0: dy1 + 1, dx0: dx1 + 1].reshape(-1, 3)
    return (int(dx0), int(dy0), int(dx1), int(dy1)), text, np.median(tpix, axis=0), np.median(dpix, axis=0)


def remove_top_line(img, dash, text):
    """Paint the banner's background back over the whole strip of the top line: every column of
    the strip is blended from the background just above it to the background just below it (so
    the blue gradient continues), smoothed, and given the same fine grain as the background."""
    a = np.asarray(img.convert("RGB")).astype(np.float32)
    dx0, dy0, dx1, dy1 = dash
    tx0, ty0, tx1, ty1 = text
    y0 = max(3, min(dy0, ty0) - 7)                 # strip: the line plus its soft edge and shadow
    y1 = min(H - 4, max(dy1, ty1) + 9)             # (+ room for comma tails below the letters)
    x0, x1 = max(3, dx0 - 10), min(W - 4, tx1 + 12)
    above = a[y0 - 3: y0].mean(axis=0)             # background rows just above / below, per column
    below = a[y1 + 1: y1 + 4].mean(axis=0)
    t = ((np.arange(y0, y1 + 1) - (y0 - 1)) / (y1 + 1 - (y0 - 1)))[:, None, None]
    band = above[None] * (1 - t) + below[None] * t
    a[y0: y1 + 1] = np.where(
        (np.arange(W)[None, :, None] >= x0) & (np.arange(W)[None, :, None] <= x1), band, a[y0: y1 + 1])
    # smooth the join with the untouched background (keeps the strip edges invisible)
    by0, by1, bx0, bx1 = y0 - 3, y1 + 4, x0 - 3, x1 + 4
    sub = a[by0:by1, bx0:bx1]
    inner = np.zeros(sub.shape[:2], bool)
    inner[3:-3, 3:-3] = True
    for _ in range(120):
        avg = (sub[:-2, 1:-1] + sub[2:, 1:-1] + sub[1:-1, :-2] + sub[1:-1, 2:]) * .25
        view = sub[1:-1, 1:-1]
        view[inner[1:-1, 1:-1]] = avg[inner[1:-1, 1:-1]]
    # the same fine grain as the background around it (fixed seed: same result every run)
    ref = np.concatenate([a[y0 - 14: y0 - 4, x0:x1], a[y1 + 5: y1 + 15, x0:x1]], axis=0)
    smooth = (ref[:-2, 1:-1] + ref[2:, 1:-1] + ref[1:-1, :-2] + ref[1:-1, 2:]) * .25
    grain = float(np.std(ref[1:-1, 1:-1] - smooth)) * .9
    rng = np.random.default_rng(7)
    noise = rng.normal(0, grain, (y1 - y0 + 1, x1 - x0 + 1, 1))
    a[y0: y1 + 1, x0: x1 + 1] += noise
    return Image.fromarray(np.clip(a + .5, 0, 255).astype(np.uint8), "RGB")


def top_line_style(found):
    """Where the top line usually is across the banners (median), in % of the banner width
    (the website sizes it with the banner, so it stays in the same place on every slide)."""
    med = lambda values: float(np.median(values))
    dash_left = med([d[0] for d, t, *_ in found])
    dash_w = med([d[2] - d[0] + 1 for d, t, *_ in found])
    dash_h = med([d[3] - d[1] + 1 for d, t, *_ in found])
    gap = med([t[0] - d[2] - 1 for d, t, *_ in found])
    cap = med([t[3] - t[1] + 1 for d, t, *_ in found])
    centre = med([(t[1] + t[3]) / 2 + .5 for d, t, *_ in found])
    text_w = med([t[2] - t[0] + 1 for d, t, *_ in found])
    to_pct = lambda v: round(v / W * 100, 3)
    return {
        "dashLeft": to_pct(dash_left), "dashWidth": to_pct(dash_w), "dashHeight": to_pct(dash_h),
        "gap": to_pct(gap), "centre": to_pct(centre), "capHeight": to_pct(cap), "textWidth": to_pct(text_w),
    }


def save_widths(img, base, widths):
    for w in widths:
        h = round(img.height * w / img.width)
        v = img if w == img.width else img.resize((w, h), Image.LANCZOS)
        v.save(os.path.join(OUT_DIR, f"{base}-{w}.webp"), "WEBP", quality=QUALITY, method=6)


def pct(box, pad=3):
    x0, y0, x1, y1 = box
    return {
        "left": round((x0 - pad) / W * 100, 2),
        "top": round((y0 - pad) / H * 100, 2),
        "width": round((x1 - x0 + 1 + 2 * pad) / W * 100, 2),
        "height": round((y1 - y0 + 1 + 2 * pad) / H * 100, 2),
    }


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    data = {}
    found = []
    missing = [k for k in KEYS if not find_source(k)]
    if missing:
        sys.exit(f"Missing banner(s) in \"Slider images\": {', '.join(k + '.png' for k in missing)}")
    for key in KEYS:
        path = find_source(key)
        name = os.path.basename(path)
        print(f"{key}: {name}")
        img = normalize(apply_fixes(key, Image.open(path)))
        R, G, B = channels(img)
        explore = find_explore_button(R, G, B)
        circle = find_circle(R, G, B, explore)
        quote = find_quote_button(R, G, B, explore, circle)
        photo = find_photo(R, G, B, circle)
        print(f"   explore {explore}  quote {quote}  photo {photo}  circle {circle}")
        base = f"banner-{key}"
        save_widths(phone_picture(img, photo, circle), f"{base}-phone", PHONE_WIDTHS)
        line = find_top_line(R, G, B)
        if line:
            print(f"   top line: dash {line[0]}  text {line[1]}  -> removed (the website shows it)")
            img = remove_top_line(img, line[0], line[1])
            found.append(line)
        else:
            print("   ! top line not found in this banner: nothing removed")
        save_widths(img, base, DESKTOP_WIDTHS)
        data[key] = {
            "source": f"Slider images/{name}",
            "banner": {"path": f"{WEB_PATH}/{base}", "widths": DESKTOP_WIDTHS, "width": W, "height": H},
            "phone": {"path": f"{WEB_PATH}/{base}-phone", "widths": PHONE_WIDTHS, "width": PHONE_W, "height": PHONE_H},
            "buttons": {"explore": pct(explore), "quote": pct(quote)},
        }
    if not found:
        sys.exit("Could not find the top line in any banner.")
    out = {"topLine": top_line_style(found), "slides": data}
    print(f"\nTop line (same place on every slide): {out['topLine']}")
    with open(JSON_OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)
        f.write("\n")
    print(f"\nWrote {len(data)} banners to {os.path.relpath(OUT_DIR, ROOT)} and {os.path.relpath(JSON_OUT, ROOT)}")
    print("Now run: npm run build")


if __name__ == "__main__":
    main()
