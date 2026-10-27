#!/usr/bin/env node
/**
 * Brand Image website builder — zero dependencies (Node.js 16+).
 *
 *   node src/build.js
 *
 * Builds the whole website into ./site, starting from an empty folder every time:
 *   1. ./site is emptied (it is build output only: never edit files in it by hand),
 *   2. everything in ./public is copied in as it is: images and fonts (public/assets),
 *      favicons, send-enquiry.php and the mailer library (public/lib),
 *   3. every page is rendered from src/pages + src/components + src/content, the CSS is
 *      bundled, the JavaScript copied, and sitemap.xml / robots.txt / site.webmanifest written.
 * So ./site can be deleted at any time and recreated with: npm run build
 * (.env is never copied: it stays in the project folder, or one folder above public_html online.)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const PUBLIC = path.join(ROOT, 'public');
const config = require('./config');
const layout = require('./components/layout');

const PAGES = [
  require('./pages/home'),
  require('./pages/about'),
  require('./pages/services'),
  require('./pages/service-detail'),
  require('./pages/blog'),
  require('./pages/gallery'),
  require('./pages/contact'),
  require('./pages/not-found'),
];

function hash(content) {
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 10);
}

function write(rel, content) {
  const file = path.join(SITE, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

/* ---------------------------------------------------------------- static files */
/** Empties ./site and copies ./public into it (files that never go online are skipped). */
const NEVER_COPY = new Set(['.env', '.DS_Store', 'Thumbs.db', 'desktop.ini']);
function copyPublic() {
  if (!fs.existsSync(PUBLIC)) {
    throw new Error(`The public folder is missing (${PUBLIC}): it holds the images, favicons and send-enquiry.php`);
  }
  fs.rmSync(SITE, { recursive: true, force: true });
  let count = 0;
  const copyDir = (from, to) => {
    fs.mkdirSync(to, { recursive: true });
    fs.readdirSync(from, { withFileTypes: true }).forEach((entry) => {
      if (NEVER_COPY.has(entry.name) || entry.name.endsWith('.zip')) return;
      const src = path.join(from, entry.name);
      const dest = path.join(to, entry.name);
      if (entry.isDirectory()) copyDir(src, dest);
      else if (entry.isFile()) { fs.copyFileSync(src, dest); count += 1; }
    });
  };
  copyDir(PUBLIC, SITE);
  return count;
}

/* ---------------------------------------------------------------- CSS */
function buildCss() {
  const dir = path.join(__dirname, 'styles');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.css')).sort();
  const source = files.map((f) => `/* ${f} */\n${fs.readFileSync(path.join(dir, f), 'utf8')}`).join('\n');
  const min = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,>])\s*/g, '$1')
    .replace(/:\s+/g, ':')
    .replace(/;}/g, '}')
    .trim();
  write('assets/css/main.css', source);
  write('assets/css/main.min.css', `${min}\n`);
  return hash(min);
}

/* ---------------------------------------------------------------- JS */
function buildJs() {
  const src = fs.readFileSync(path.join(__dirname, 'scripts', 'main.js'), 'utf8');
  // Light, safe minification: drop full-line comments and indentation.
  const min = src
    .split('\n')
    .filter((line) => !/^\s*\/\/(?!#)/.test(line))
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
  write('assets/js/main.js', src);
  write('assets/js/main.min.js', `${min}\n`);
  return hash(min);
}

function buildHeroJs() {
  const result = esbuild.buildSync({
    entryPoints: [path.join(__dirname, 'scripts', 'hero-slider-client.js')],
    outfile: path.join(SITE, 'assets', 'js', 'hero-slider.min.js'),
    bundle: true,
    minify: true,
    platform: 'browser',
    format: 'iife',
    target: ['es2018'],
    write: false,
  });
  const output = result.outputFiles[0].contents;
  fs.mkdirSync(path.join(SITE, 'assets', 'js'), { recursive: true });
  fs.writeFileSync(path.join(SITE, 'assets', 'js', 'hero-slider.min.js'), output);
  return hash(output);
}

/* ---------------------------------------------------------------- SEO files */
function buildSeoFiles(pages) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = pages
    .filter((p) => !p.def.noindex)
    .map((p) => {
      const loc = `${config.siteUrl}/${p.path === 'index.html' ? '' : p.path}`;
      const priority = p.path === 'index.html' ? '1.0' : p.def.nav === 'services' ? '0.9' : '0.7';
      return `  <url><loc>${loc}</loc><lastmod>${today}</lastmod><priority>${priority}</priority></url>`;
    })
    .join('\n');
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`);
  write('site.webmanifest', JSON.stringify({
    name: config.company.name,
    short_name: config.company.shortName,
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#2468B1',
    icons: [
      { src: 'assets/img/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'assets/img/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }, null, 2));
}

/* ---------------------------------------------------------------- checks */
function checkOutput(pages) {
  const problems = [];
  // url(...) references inside the stylesheet
  const css = fs.readFileSync(path.join(SITE, 'assets/css/main.css'), 'utf8');
  [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].forEach((m) => {
    if (/^(data:|https?:)/.test(m[1])) return;
    if (!fs.existsSync(path.join(SITE, 'assets/css', m[1]))) problems.push(`main.css: missing ${m[1]}`);
  });
  const built = new Set(pages.map((p) => p.path));
  const skip = /^(https?:|mailto:|tel:|#|data:|javascript:)/;
  pages.forEach((p) => {
    const html = fs.readFileSync(path.join(SITE, p.path), 'utf8');
    const refs = [...html.matchAll(/\s(?:href|src|data-src|data-full)="([^"]+)"/g)].map((m) => m[1]);
    const srcsets = [...html.matchAll(/\s(?:srcset|data-srcset|imagesrcset)="([^"]+)"/g)]
      .flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+/)[0]));
    [...refs, ...srcsets].forEach((ref) => {
      if (!ref || skip.test(ref)) return;
      const clean = decodeURIComponent(ref.split(/[?#]/)[0]);
      if (!clean) return;
      if (clean.endsWith('.html')) {
        if (!built.has(clean)) problems.push(`${p.path}: missing page ${clean}`);
      } else if (!fs.existsSync(path.join(SITE, clean))) {
        problems.push(`${p.path}: missing file ${clean}`);
      }
    });
    const h1 = (html.match(/<h1[\s>]/g) || []).length;
    if (h1 !== 1) problems.push(`${p.path}: expected 1 <h1>, found ${h1}`);
    const noAlt = [...html.matchAll(/<img(?![^>]*\salt=)[^>]*>/g)];
    if (noAlt.length) problems.push(`${p.path}: ${noAlt.length} <img> without alt`);
  });
  return problems;
}

/* Light sections alternate white and off-white (brand guidelines: off-white for sections), so
   two sections in a row never share a background. The first light section after the page header
   or a coloured band keeps the background it was designed with; a "flush-top" section continues
   the one above it. */
function alternateSections(html) {
  const TINTS = ['section--page', 'section--soft', 'section--cream'];
  let prev = null;
  return html.replace(/<section class="([^"]*)"/g, (tag, cls) => {
    const c = cls.split(/\s+/).filter(Boolean);
    if (!c.includes('section') || c.includes('section--dark') || c.includes('section--blue') || c.includes('on-dark')) {
      prev = null;
      return tag;
    }
    const designed = c.some((x) => TINTS.includes(x)) ? 'tint' : 'white';
    let bg;
    if (c.includes('section--flush-top')) bg = prev || designed;
    else if (!prev) bg = designed;
    else bg = prev === 'white' ? 'tint' : 'white';
    prev = bg;
    const out = c.filter((x) => !TINTS.includes(x));
    if (bg === 'tint') out.splice(1, 0, 'section--page');
    return `<section class="${out.join(' ')}"`;
  });
}

function main() {
  const t0 = Date.now();
  const copied = copyPublic();
  const assets = { css: buildCss(), js: buildJs(), hero: buildHeroJs() };
  const pages = PAGES.flatMap((fn) => fn());
  const seen = new Set();
  pages.forEach((p) => {
    if (seen.has(p.path)) throw new Error(`Duplicate page path: ${p.path}`);
    seen.add(p.path);
    write(p.path, layout.page(p.def, alternateSections(p.main), assets));
  });
  buildSeoFiles(pages);
  const problems = checkOutput(pages);
  console.log(`Copied ${copied} files from public, built ${pages.length} pages in ${Date.now() - t0} ms → ${path.relative(process.cwd(), SITE) || SITE}`);
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):\n - ${problems.join('\n - ')}`);
    process.exitCode = 1;
  } else {
    console.log('Link, image, heading and alt-text checks passed.');
  }
}

main();
