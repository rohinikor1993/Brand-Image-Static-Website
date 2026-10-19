/**
 * Document shell: <head>, top bar, header + navigation, footer, mobile drawer,
 * mobile call bar, lightbox and scripts.
 */
const config = require('../config');
const services = require('../content/services.json');
const { esc, attrs, icon, btn, img } = require('./helpers');

const NAV = [
  { key: 'home', label: 'Home', href: 'index.html' },
  { key: 'about', label: 'About Us', href: 'about.html' },
  { key: 'services', label: 'Services', href: 'service.html', mega: true },
  { key: 'blog', label: 'Blog', href: 'blog.html' },
  { key: 'gallery', label: 'Gallery', href: 'gallery.html' },
  { key: 'contact', label: 'Contact Us', href: 'contact.html' },
];

/* The Brand Image logo from the brand identity guidelines ("Colour palate" folder), made web-ready
   by src/tools/guideline_logo.py and src/tools/brand_assets.py: same artwork, transparent
   background, exact Brand Blue #2468B1 and Brand Orange #F7A40A. Always shown at its own
   proportions (only the height is set in CSS). */
const LOGO = {
  src: 'assets/img/brand/brand-image-logo-360.webp',
  srcset: 'assets/img/brand/brand-image-logo-360.webp 360w, assets/img/brand/brand-image-logo-720.webp 720w',
  width: 360,
  height: 120,
};

const primaryPhone = config.phones[0];
const waLink = `https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent(config.whatsapp.message)}`;

/** Phone number text that never breaks across lines */
function phoneText(p) {
  return esc(p.display).replace(/ /g, '&nbsp;');
}

/* The same logo everywhere (header, mobile menu, footer): on the navy header and footer it sits on a
   small white plate (.brand-logo in 05-header.css, .footer-logo in 07-sections.css). */
function logoImg({ height = 46, sizes = '202px', eager = true } = {}) {
  return `<img${attrs({
    src: LOGO.src,
    srcset: LOGO.srcset,
    sizes,
    width: LOGO.width,
    height: LOGO.height,
    alt: `${config.company.name} — ${config.company.positioning}`,
    loading: eager ? 'eager' : 'lazy',
    decoding: 'async',
    // The header logo is sized in CSS (05-header.css); other logos use a fixed height.
    style: height ? `height:${height}px` : null,
  })}>`;
}

/* ------------------------------------------------------------------ head */
function head(page, assets) {
  const url = `${config.siteUrl}/${page.path === 'index.html' ? '' : page.path}`;
  const ogImage = `${config.siteUrl}/${page.ogImage || 'assets/img/brand/og-brand-image.jpg'}`;
  const preload = (page.preload || [])
    .map((p) => {
      const href = p.href || p.srcset.split(' ')[0];
      const type = p.type || (href.endsWith('.png') ? 'image/png' : 'image/webp');
      return `<link rel="preload" as="image" type="${esc(type)}" href="${esc(href)}" imagesrcset="${esc(p.srcset)}" imagesizes="${esc(p.sizes)}"${p.media ? ` media="${esc(p.media)}"` : ''} fetchpriority="high">`;
    })
    .join('\n  ');
  const jsonld = (page.jsonld || [])
    .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`)
    .join('\n  ');
  const ga = config.analyticsId
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${config.analyticsId}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${config.analyticsId}');</script>`
    : '';
  const robots = page.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large';
  return `<head>
  <meta charset="utf-8">
  ${page.base ? `<base href="${page.base}">` : ''}
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(page.title)}</title>
  <meta name="description" content="${esc(page.description)}">
  ${page.noindex ? '' : `<link rel="canonical" href="${esc(url)}">`}
  <meta name="robots" content="${robots}">
  <meta name="theme-color" content="#2468B1">
  <meta name="format-detection" content="telephone=no">
  ${page.path === 'index.html' && config.googleSiteVerification ? `<meta name="google-site-verification" content="${esc(config.googleSiteVerification)}">` : ''}
  <meta property="og:type" content="${page.ogType || 'website'}">
  <meta property="og:site_name" content="${esc(config.company.name)}">
  <meta property="og:locale" content="en_IN">
  <meta property="og:title" content="${esc(page.ogTitle || page.title)}">
  <meta property="og:description" content="${esc(page.description)}">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:image" content="${esc(ogImage)}">
  ${page.ogImage ? '' : '<meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">'}
  <meta property="og:image:alt" content="${esc(config.company.name)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="favicon.ico" sizes="48x48">
  <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
  <link rel="apple-touch-icon" href="apple-touch-icon.png">
  <link rel="manifest" href="site.webmanifest">
  <link rel="preload" href="assets/fonts/montserrat-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  ${preload}
  <link rel="stylesheet" href="assets/css/main.min.css?v=${assets.css}">
  <script>document.documentElement.classList.add('js');</script>
  ${ga}
  ${jsonld}
</head>`;
}

/* ------------------------------------------------------------------ header */
/* The Services menu (05-header.css): a light cream panel as wide as the header. On the left the
   "All Services" card; on the right the seven services in three groups, each under a small heading,
   with "Know more" for the Services page under the last group. */
const MEGA_GROUPS = [
  { title: 'Printing & Branding', keys: ['printing', 'shop-branding', 'promotional'] },
  { title: 'Outdoor & Transit', keys: ['outdoor', 'transit', 'wall-painting'] },
  { title: 'Events & Activation', keys: ['events'] },
];
{
  // every service must be in a group (a new service in services.json needs a place here)
  const grouped = MEGA_GROUPS.flatMap((g) => g.keys);
  const missing = services.filter((s) => !grouped.includes(s.key)).map((s) => s.key);
  if (missing.length) throw new Error(`Services menu: add ${missing.join(', ')} to MEGA_GROUPS in layout.js`);
}

function megaMenu(currentService) {
  const byKey = Object.fromEntries(services.map((s) => [s.key, s]));
  const last = MEGA_GROUPS.length - 1;
  const groups = MEGA_GROUPS.map((g, i) => `<div class="mega__group">
          <p class="mega__heading">${esc(g.title)}</p>
          <ul>${g.keys.map((k) => byKey[k]).filter(Boolean).map((sv) => `<li><a class="mega__link" href="${sv.slug}.html"${sv.key === currentService ? ' aria-current="page"' : ''}>${esc(sv.name)}</a></li>`).join('')}</ul>
          ${i === last ? `<a class="mega__more" href="service.html">Know more ${icon('arrow-right')}</a>` : ''}
        </div>`).join('\n        ');
  return `<div class="mega" id="mega-services">
      <div class="mega__side">
        <a class="mega__feature" href="service.html">
          <span class="mega__feature-icon" aria-hidden="true">${icon('layout-grid')}</span>
          <span class="mega__feature-title">All Services</span>
          <span class="mega__feature-text">Printing, branding, outdoor and transit media, digital wall painting, events and promotional material.</span>
        </a>
      </div>
      <div class="mega__main">
        <div class="mega__groups">
        ${groups}
        </div>
      </div>
    </div>`;
}

function header(page) {
  const links = NAV.map((item) => {
    const current = page.nav === item.key;
    const aria = current && !page.navSub ? ' aria-current="page"' : '';
    if (item.mega) {
      return `<li class="main-nav__item main-nav__item--menu${current ? ' is-current' : ''}" data-mega>
      <a class="main-nav__link" href="${item.href}"${aria}>${esc(item.label)}</a>
      <button class="main-nav__toggle" type="button" aria-expanded="false" aria-controls="mega-services">${icon('chevron-down')}<span class="sr-only">Show ${esc(item.label.toLowerCase())} menu</span></button>
      ${megaMenu(page.serviceKey)}
    </li>`;
    }
    return `<li class="main-nav__item${current ? ' is-current' : ''}"><a class="main-nav__link" href="${item.href}"${aria}>${esc(item.label)}</a></li>`;
  }).join('\n      ');
  return `<header class="site-header">
  <div class="container site-header__inner">
    <a class="brand-logo" href="index.html" aria-label="${esc(config.company.name)} — home">${logoImg({ height: null, sizes: '(min-width: 1200px) 150px, 132px' })}</a>
    <nav class="main-nav" aria-label="Main">
      <ul class="main-nav__list">
      ${links}
      </ul>
      <span class="main-nav__indicator" aria-hidden="true"></span>
    </nav>
    <div class="header-actions">
      <a class="header-call" href="tel:${primaryPhone.tel}" aria-label="Call us on ${esc(primaryPhone.display)}">${icon('phone')}</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav">${icon('menu')}<span class="sr-only">Open menu</span></button>
    </div>
  </div>
</header>`;
}

/* ------------------------------------------------------------------ mobile drawer */
function mobileNav(page) {
  const items = NAV.map((item) => {
    const current = page.nav === item.key && !page.navSub;
    if (item.mega) {
      const open = page.nav === 'services';
      const sub = services
        .map((s) => `<li><a href="${s.slug}.html"${page.serviceKey === s.key ? ' aria-current="page"' : ''}>${icon(s.icon)}<span>${esc(s.name)}</span></a></li>`)
        .join('');
      return `<li>
          <div class="mobile-nav__row">
            <a class="mobile-nav__link" href="${item.href}"${current ? ' aria-current="page"' : ''}>${esc(item.label)}</a>
            <button class="mobile-nav__acc" type="button" aria-expanded="${open}" aria-controls="mobile-services">${icon('chevron-down')}<span class="sr-only">Show services</span></button>
          </div>
          <ul class="mobile-nav__sub" id="mobile-services"${open ? '' : ' hidden'}>${sub}</ul>
        </li>`;
    }
    return `<li><a class="mobile-nav__link" href="${item.href}"${current ? ' aria-current="page"' : ''}>${esc(item.label)}</a></li>`;
  }).join('\n        ');
  return `<div class="mobile-nav" id="mobile-nav" inert>
  <div class="mobile-nav__backdrop" data-close-nav></div>
  <div class="mobile-nav__panel" role="dialog" aria-modal="true" aria-label="Menu">
    <div class="mobile-nav__head">
      <a href="index.html" aria-label="${esc(config.company.name)} — home">${logoImg({ height: 40, sizes: '176px', eager: false })}</a>
      <button class="mobile-nav__close" type="button" data-close-nav>${icon('x')}<span class="sr-only">Close menu</span></button>
    </div>
    <nav class="mobile-nav__body" aria-label="Mobile">
      <ul class="mobile-nav__list">
        ${items}
      </ul>
    </nav>
    <div class="mobile-nav__foot">
      ${btn({ href: `tel:${primaryPhone.tel}`, label: `Call ${primaryPhone.display}`, variant: 'accent', iconLeft: 'phone', iconName: null })}
      ${btn({ href: waLink, label: 'WhatsApp Us', variant: 'secondary', iconLeft: 'whatsapp', iconName: null, external: true })}
      <p class="mobile-nav__meta"><a href="mailto:${config.email}">${esc(config.email)}</a><br>${esc(config.address.lines.join(' '))}</p>
    </div>
  </div>
</div>`;
}

/* ------------------------------------------------------------------ footer */
/* The navy of the navigation bar, with the Brand Image office at dusk fading in on the right (an AI
   picture made by src/tools/render_artwork.js); no other decoration. Styles: "Footer" in 07-sections.css. */
const FOOTER_ART = 'footer-office';

function footer() {
  // every Quick Link and service with a small orange arrow in front of it
  const arrow = icon('chevron-right', { cls: 'footer-links__arrow' });
  const link = (href, label) => `<li><a href="${href}">${arrow}<span>${esc(label)}</span></a></li>`;
  const quick = NAV.map((n) => link(n.href, n.label)).join('');
  const svc = services.map((s) => link(`${s.slug}.html`, s.name)).join('');
  const social = config.social
    .map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(s.name)} (opens in a new tab)">${icon(s.icon)}</a>`)
    .join('');
  const tile = (name) => `<span class="footer-contact__icon" aria-hidden="true">${icon(name)}</span>`;
  const secondary = config.secondaryOffice && config.secondaryOffice.show
    ? `<li class="footer-contact__place">${tile('map-pin')}<address>${config.secondaryOffice.lines.map(esc).join('<br>')}</address></li>`
    : '';
  const year = new Date().getFullYear();
  return `<footer class="site-footer on-dark">
  <div class="footer-art" aria-hidden="true">${img(FOOTER_ART, { sizes: '(min-width: 1024px) 36vw, 60vw', target: 600, alt: '' })}</div>
  <div class="container footer-top">
    <div class="footer-about">
      <a class="footer-logo" href="index.html" aria-label="${esc(config.company.name)} — home">${logoImg({ height: null, sizes: '202px', eager: false })}</a>
      <p>${config.company.footerDesc || esc(config.company.tagline)}</p>
      <div class="footer-social">
        ${social}
        <a href="${esc(waLink)}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp (opens in a new tab)">${icon('whatsapp')}</a>
      </div>
    </div>
    <nav aria-labelledby="footer-quick">
      <h2 class="footer-title" id="footer-quick">Quick Links</h2>
      <ul class="footer-links">
        ${quick}
      </ul>
    </nav>
    <nav aria-labelledby="footer-services">
      <h2 class="footer-title" id="footer-services">Services</h2>
      <ul class="footer-links">${svc}</ul>
    </nav>
    <div>
      <h2 class="footer-title">Contact</h2>
      <ul class="footer-contact">
        <li>${tile('phone')}<span>${config.phones.map((p) => `<a href="tel:${p.tel}">${phoneText(p)}</a>`).join('<br>')}</span></li>
        <li>${tile('mail')}<span><a href="mailto:${config.email}">${esc(config.email)}</a></span></li>
        <li class="footer-contact__place">${tile('map-pin')}<address>${esc(config.company.name)},<br>${config.address.lines.map(esc).join('<br>')}</address></li>
        ${secondary}
        ${config.businessHours ? `<li>${tile('clock')}<span>${esc(config.businessHours)}</span></li>` : ''}
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="container footer-bottom__inner">
      <p>© <span data-year>${year}</span> ${esc(config.company.name)}. All rights reserved.${config.footerCredit ? ` ${esc(config.footerCredit)}` : ''}</p>
      <p class="footer-bottom__tag"><span class="diamond" aria-hidden="true"></span>${esc(config.company.positioning)}</p>
    </div>
  </div>
</footer>`;
}

function mobileCta() {
  return `<div class="mobile-cta">
  ${btn({ href: `tel:${primaryPhone.tel}`, label: 'Call Now', variant: 'accent', iconLeft: 'phone', iconName: null })}
  ${btn({ href: waLink, label: 'WhatsApp', variant: 'secondary', cls: 'btn--whatsapp', iconLeft: 'whatsapp', iconName: null, external: true })}
</div>`;
}

function lightbox() {
  return `<dialog class="lightbox on-dark" id="lightbox" aria-label="Image viewer">
  <div class="lightbox__bar">
    <span class="lightbox__counter" aria-live="polite"></span>
    <div class="lightbox__tools">
      <button class="lb-btn" type="button" data-lb-fullscreen aria-label="View full screen"><span class="icon-max">${icon('maximize')}</span><span class="icon-min" hidden>${icon('minimize')}</span></button>
      <button class="lb-btn" type="button" data-lb-close aria-label="Close image viewer">${icon('x')}</button>
    </div>
  </div>
  <div class="lightbox__stage">
    <figure class="lightbox__figure">
      <img class="lightbox__img" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="">
      <figcaption class="lightbox__caption"></figcaption>
    </figure>
    <button class="lb-btn lightbox__nav lightbox__nav--prev" type="button" data-lb-prev aria-label="Previous image">${icon('chevron-left')}</button>
    <button class="lb-btn lightbox__nav lightbox__nav--next" type="button" data-lb-next aria-label="Next image">${icon('chevron-right')}</button>
  </div>
</dialog>`;
}

/* ------------------------------------------------------------------ document */
function page(pageDef, main, assets) {
  return `<!doctype html>
<html lang="en-IN">
${head(pageDef, assets)}
<body class="${esc(pageDef.bodyClass || '')} has-mobile-cta">
<a class="skip-link" href="#main">Skip to main content</a>
${header(pageDef)}
<main id="main" tabindex="-1">
${main}
</main>
${footer()}
${mobileCta()}
<button class="to-top" type="button" aria-label="Back to top">${icon('arrow-up')}</button>
${mobileNav(pageDef)}
${lightbox()}
${pageDef.heroSlider ? `<script src="assets/js/hero-slider.min.js?v=${assets.hero}" defer></script>` : ''}
<script src="assets/js/main.min.js?v=${assets.js}" defer></script>
</body>
</html>
`;
}

module.exports = { page, NAV, waLink, primaryPhone, logoImg, phoneText };
