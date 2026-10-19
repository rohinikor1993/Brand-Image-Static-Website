/**
 * Small HTML helpers shared by all components.
 */
const IMAGES = require('../content/images.json');
const ICONS = require('../content/icons.json');

const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/** Escape text for use inside HTML text or attribute values. */
function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Join attribute map into a string, skipping null/false values. */
function attrs(map) {
  return Object.entries(map)
    .filter(([, v]) => v !== null && v !== undefined && v !== false)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(v)}"`))
    .join('');
}

/** Inline SVG icon (Lucide stroke icons + simple brand icons). */
function icon(name, { cls = '', label = null, size = 24 } = {}) {
  const a11y = label ? ` role="img" aria-label="${esc(label)}"` : ' aria-hidden="true" focusable="false"';
  if (ICONS.brands[name]) {
    return `<svg class="icon icon--brand ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"${a11y}><path d="${ICONS.brands[name]}"/></svg>`;
  }
  const paths = ICONS.stroke[name];
  if (!paths) throw new Error(`Unknown icon: ${name}`);
  return `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${a11y}>${paths}</svg>`;
}

function image(key) {
  const im = IMAGES[key];
  if (!im) throw new Error(`Unknown image: ${key}`);
  return im;
}

function srcFor(key, target = 800) {
  const im = image(key);
  const w = im.widths.find((x) => x >= target) || im.widths[im.widths.length - 1];
  return `${im.path}-${w}.${im.format || 'webp'}`;
}

/** Largest available variant (used by the lightbox). */
function fullSrc(key) {
  const im = image(key);
  return `${im.path}-${im.widths[im.widths.length - 1]}.${im.format || 'webp'}`;
}

function srcsetFor(key) {
  const im = image(key);
  return im.widths.map((w) => `${im.path}-${w}.${im.format || 'webp'} ${w}w`).join(', ');
}

/** srcset / src for an image set described as { path, widths } (the slider banners, see hero-banners.json) */
function setSrcset(set) {
  return set.widths.map((w) => `${set.path}-${w}.webp ${w}w`).join(', ');
}

function setSrc(set, target = 800) {
  return `${set.path}-${set.widths.find((w) => w >= target) || set.widths[set.widths.length - 1]}.webp`;
}

/**
 * Responsive <img>. Options:
 *  sizes, loading ('lazy'|'eager'), priority (fetchpriority=high), cls,
 *  alt (override), deferred (load later via JS — used for hidden slides)
 */
function img(key, opts = {}) {
  const im = image(key);
  const {
    sizes = '100vw',
    loading = 'lazy',
    priority = false,
    cls = null,
    alt = im.alt,
    deferred = false,
    target = 800,
  } = opts;
  const src = srcFor(key, target);
  const srcset = srcsetFor(key);
  const base = {
    class: cls,
    width: im.width,
    height: im.height,
    alt,
    sizes,
    loading: priority ? 'eager' : loading,
    decoding: 'async',
    fetchpriority: priority ? 'high' : null,
    style: im.focal && im.focal !== '50% 50%' ? `object-position:${im.focal}` : null,
  };
  if (deferred) {
    return `<img${attrs({ src: PIXEL, 'data-src': src, 'data-srcset': srcset, ...base, loading: 'lazy' })}>`;
  }
  return `<img${attrs({ src, srcset, ...base })}>`;
}

function arrow() {
  return icon('arrow-right', { cls: 'icon--arrow' });
}

/** Button/link styled as a button. */
function btn({ href, label, variant = 'primary', iconName = 'arrow-right', iconLeft = null, size = null, external = false, cls = '', attrs: extra = {} }) {
  const classes = ['btn', `btn--${variant}`, size ? `btn--${size}` : '', cls].filter(Boolean).join(' ');
  const ext = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  const left = iconLeft ? icon(iconLeft) : '';
  const right = iconName ? icon(iconName, { cls: iconName === 'arrow-right' ? 'icon--arrow' : iconName === 'arrow-up-right' ? 'icon--ext' : '' }) : '';
  const srExt = external ? '<span class="sr-only"> (opens in a new tab)</span>' : '';
  // Keep phone numbers on one line inside buttons
  let text = esc(label).replace(/(\+91) (\d{10})/g, '$1&nbsp;$2');
  if (String(href).startsWith('tel:')) text = text.replace(/ /g, '&nbsp;');
  return `<a${attrs({ class: classes, href, ...ext, ...extra })}>${left}<span>${text}</span>${srExt}${right}</a>`;
}

function formatDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

function readingTime(blocks) {
  const text = blocks
    .map((b) => b.p || b.h2 || b.h3 || (b.ul ? b.ul.join(' ') : '') || (b.faq ? b.faq.map((f) => `${f.q} ${f.a}`).join(' ') : ''))
    .join(' ')
    .replace(/<[^>]+>/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Strip tags for meta descriptions / excerpts. */
function plain(html) {
  return String(html).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function excerpt(html, max = 170) {
  const t = plain(html);
  if (t.length <= max) return t;
  return `${t.slice(0, t.lastIndexOf(' ', max)).replace(/[,.;:]$/, '')}…`;
}

/** Remove links that point to the current page (legacy copy linked pages to themselves). */
function unlinkSelf(html, currentFile) {
  return String(html).replace(/<a href="([^"]+)">([^<]*)<\/a>/g, (m, href, text) => (href === currentFile ? text : m));
}

/**
 * A heading whose words rise into place one after another (08-motion.css). Each word is wrapped in
 * <span class="w"><span class="w__i" style="--i:n">word</span></span>; tags inside the heading (such
 * as the orange marker <span class="hl">) are kept. Screen readers get the heading text from
 * aria-label, and the split copy is hidden from them so it is not read word by word.
 *   const t = splitTitle(html);  `<h2${t.attrs}>${t.html}</h2>`
 */
function splitTitle(html) {
  let n = 0;
  const words = String(html)
    .split(/(<[^>]+>)/)
    .map((part) => {
      if (!part || part.startsWith('<')) return part;
      return part
        .split(/([ \t\r\n]+)/)
        .map((tok) => (!tok || /^[ \t\r\n]+$/.test(tok) ? tok : `<span class="w"><span class="w__i" style="--i:${n++}">${tok}</span></span>`))
        .join('');
    })
    .join('');
  const label = plain(String(html).replace(/&nbsp;/g, ' ').replace(/<br\s*\/?>/gi, ' ')).replace(/"/g, '&quot;');
  return { attrs: ` aria-label="${label}"`, html: `<span class="words" aria-hidden="true">${words}</span>`, words: n };
}

module.exports = {
  IMAGES, esc, attrs, icon, img, srcFor, srcsetFor, setSrc, setSrcset, fullSrc, image, btn, arrow,
  formatDate, readingTime, plain, excerpt, unlinkSelf, splitTitle, PIXEL,
};
