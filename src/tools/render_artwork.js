#!/usr/bin/env node
/**
 * Build the composed pictures of the site (from the AI photos in site/assets/img/hero-ai/ and the contact banner):
 *
 *   consult the photo of the "Need a Consultation?" card (Home, Services, About): consultation.png in the
 *           project folder (2172 x 724) with its own lines of text taken out (the card sets them as real text),
 *           by src/tools/consultation-photo.html. Saves site/assets/img/cta/brand-image-consultation-2172.webp,
 *           -1440 and -960.
 *   cta     the earlier collage of the seven services for that card (no longer shown):
 *           src/tools/cta-collage.html — the seven service photos cut on the diagonal, in one colour
 *           grade, with a Brand Blue and a Brand Orange cut; the left edge and the gaps are see-through.
 *           Saves site/assets/img/cta/brand-image-services-collage-1600.webp and -960.webp.
 *           To show another part of a photo, edit the `panels` list in cta-collage.html.
 *   footer  the office building on the right of the footer: src/tools/footer-building.html — the AI
 *           shop-front photo at dusk with the Brand Image logo as a lit sign on the blue fascia.
 *           Saves site/assets/img/footer/brand-image-office-1000.webp and -600.webp.
 *           To move the sign, edit the four SIGN corner points in footer-building.html.
 *   contact the Brand Image office building behind the Contact page header: contact-building.png in the
 *           project folder (931 x 1690, the real logo on its lit sign and the seven services on its wall),
 *           shown by src/tools/contact-building.html. Saves
 *           site/assets/img/contact/brand-image-office-building-904.webp and -452.webp. A replacement picture
 *           of another size needs the canvas and clip below changed to its size.
 *   gallery the photo behind the Gallery page header: gallery-header.png in the project folder (1672 x 941),
 *           shown by src/tools/gallery-header.html. Saves site/assets/img/gallery/gallery-header-1672.webp,
 *           -1200 and -800.
 *   slider  the home-page slider: each banner in "Slider images/" (<service key>.png, .jpg or .webp, one
 *           per service in src/content/services.json), shown at its own size by
 *           src/tools/slider-banner.html. Saves site/assets/img/slider-artwork/<key>-1672.webp, -1280
 *           and -800 (no wider than the banner) and updates the slider-art-<key> entries (size, widths)
 *           in src/content/images.json.
 *
 * Usage (from the project folder; needs Node.js 22+ and Google Chrome or Microsoft Edge):
 *   node src/tools/render_artwork.js            (all six)
 *   node src/tools/render_artwork.js footer     (one of them)
 *   npm run build
 *
 * If the browser is not found, set CHROME to its full path.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.join(__dirname, '..', '..');
const IMG = path.join(ROOT, 'site', 'assets', 'img');

const JOBS = {
  consult: {
    page: 'consultation-photo.html',
    canvas: [2172, 724],
    clip: [0, 0, 2172, 724],
    out: path.join(IMG, 'cta', 'brand-image-consultation'),
    sizes: [2172, 1440, 960],
    images: 1,
    transparent: false,
  },
  cta: {
    page: 'cta-collage.html',
    canvas: [1600, 1120],
    clip: [0, 0, 1600, 1120],
    out: path.join(IMG, 'cta', 'brand-image-services-collage'),
    sizes: [1600, 960],
    images: 7,
    transparent: true,
  },
  footer: {
    page: 'footer-building.html',
    canvas: [1672, 941],
    clip: [80, 0, 1000, 941],
    out: path.join(IMG, 'footer', 'brand-image-office'),
    sizes: [1000, 600],
    images: 3,
    transparent: false,
  },
  gallery: {
    page: 'gallery-header.html',
    canvas: [1672, 941],
    clip: [0, 0, 1672, 941],
    out: path.join(IMG, 'gallery', 'gallery-header'),
    sizes: [1672, 1200, 800],
    images: 1,
    transparent: false,
  },
  contact: {
    page: 'contact-building.html',
    canvas: [931, 1690],
    clip: [0, 0, 931, 1690],
    out: path.join(IMG, 'contact', 'brand-image-office-building'),
    sizes: [904, 452],
    images: 1,
    transparent: false,
  },
};

const SLIDER = {
  src: path.join(ROOT, 'Slider images'),
  out: path.join(IMG, 'slider-artwork'),
  sizes: [1672, 1280, 800],
  quality: 86,
  manifest: path.join(ROOT, 'src', 'content', 'images.json'),
};

const BROWSERS = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function render(send, name, job) {
  const [cw, ch] = job.canvas;
  const [x, y, w, h] = job.clip;
  await send('Emulation.setDeviceMetricsOverride', { width: cw, height: ch, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setDefaultBackgroundColorOverride', job.transparent ? { color: { r: 0, g: 0, b: 0, a: 0 } } : {});
  await send('Page.navigate', { url: pathToFileURL(path.join(__dirname, job.page)).href });
  await sleep(800);
  const ready = await send('Runtime.evaluate', { expression: 'window.__ready.then(() => document.images.length)', awaitPromise: true, returnByValue: true });
  if (ready.result.exceptionDetails || ready.result.result.value !== job.images) {
    throw new Error(`${name}: could not load the pictures used by ${job.page}.`);
  }
  fs.mkdirSync(path.dirname(job.out), { recursive: true });
  for (const size of job.sizes) {
    const shot = await send('Page.captureScreenshot', { format: 'webp', quality: 80, clip: { x, y, width: w, height: h, scale: size / w } });
    const file = `${job.out}-${size}.webp`;
    fs.writeFileSync(file, Buffer.from(shot.result.data, 'base64'));
    console.log(`Saved ${path.relative(ROOT, file)}`);
  }
}

async function renderSlider(send) {
  const keys = require('../content/services.json').map((s) => s.key);
  const manifest = JSON.parse(fs.readFileSync(SLIDER.manifest, 'utf8'));
  fs.mkdirSync(SLIDER.out, { recursive: true });
  for (const key of keys) {
    const file = ['.png', '.jpg', '.jpeg', '.webp'].map((ext) => path.join(SLIDER.src, key + ext)).find((f) => fs.existsSync(f));
    if (!file) throw new Error(`slider: no banner for "${key}" in "Slider images" (${key}.png, .jpg or .webp).`);
    await send('Emulation.setDefaultBackgroundColorOverride', {});
    await send('Page.navigate', { url: `${pathToFileURL(path.join(__dirname, 'slider-banner.html')).href}?src=${encodeURIComponent(pathToFileURL(file).href)}` });
    await sleep(500);
    const ready = await send('Runtime.evaluate', { expression: 'window.__ready', awaitPromise: true, returnByValue: true });
    if (ready.result.exceptionDetails) throw new Error(`slider: could not load ${path.relative(ROOT, file)}.`);
    const { width, height } = ready.result.result.value;
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await sleep(200);
    const widths = [...new Set(SLIDER.sizes.map((size) => Math.min(size, width)))].sort((a, b) => a - b);
    for (const size of widths) {
      const shot = await send('Page.captureScreenshot', { format: 'webp', quality: SLIDER.quality, clip: { x: 0, y: 0, width, height, scale: size / width } });
      const out = path.join(SLIDER.out, `${key}-${size}.webp`);
      fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
      console.log(`Saved ${path.relative(ROOT, out)}`);
    }
    const entry = manifest[`slider-art-${key}`] || {};
    delete entry.format;
    manifest[`slider-art-${key}`] = { ...entry, path: `assets/img/slider-artwork/${key}`, widths, width, height };
  }
  fs.writeFileSync(SLIDER.manifest, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Updated ${path.relative(ROOT, SLIDER.manifest)}`);
}

async function main() {
  const all = [...Object.keys(JOBS), 'slider'];
  const names = process.argv.slice(2).length ? process.argv.slice(2) : all;
  const unknown = names.filter((n) => !all.includes(n));
  if (unknown.length) throw new Error(`Unknown picture: ${unknown.join(', ')} (choose from: ${all.join(', ')})`);
  const browser = BROWSERS.find((p) => fs.existsSync(p));
  if (!browser) throw new Error('Chrome or Edge not found; set CHROME to its full path.');
  if (typeof WebSocket === 'undefined') throw new Error('Needs Node.js 22 or newer.');
  const port = 9400 + Math.floor(Math.random() * 400);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'artwork-'));
  const proc = spawn(browser, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--allow-file-access-from-files', '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  try {
    let target = null;
    for (let i = 0; i < 50 && !target; i++) {
      try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page'); } catch (e) { /* not up yet */ }
      if (!target) await sleep(200);
    }
    if (!target) throw new Error('The browser did not start.');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.addEventListener('open', resolve));
    let id = 0;
    const waiting = new Map();
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id); }
    });
    const send = (method, params = {}) => new Promise((resolve) => { const n = ++id; waiting.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params })); });
    for (const name of names) await (name === 'slider' ? renderSlider(send) : render(send, name, JOBS[name]));
    ws.close();
  } finally {
    proc.kill();
    await sleep(300);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* browser still closing */ }
  }
}

main().catch((err) => { console.error(err.message); process.exit(1); });
