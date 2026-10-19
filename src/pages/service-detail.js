const config = require('../config');
const services = require('../content/services.json');
const HERO_COPY = require('../content/hero-copy');
const { IMAGES, esc, icon, img, btn, srcFor, srcsetFor, unlinkSelf, splitTitle } = require('../components/helpers');
const S = require('../components/sections');
const seo = require('../components/seo');
const { phoneText, waLink } = require('../components/layout');

/* Service pages (styled in 10-services.css, classes svc-…). Every page uses the same parts and the same
   design system — navy, blue, cream and an orange accent. Its header is the service's banner from the
   home page slider (Slider images/<key>.png), full screen like on Home (06-hero.css). The words of each
   page are the existing service copy (services.json, hero-copy.js). */

/* The project photo shown first in the overview when the service has no overview photo of its own */
const INTRO_FALLBACK = { 'wall-painting': 'wall-work-1', events: 'event-stage' };

/* The service's slider banner (src/content/images.json, made by `node src/tools/render_artwork.js slider`) */
const banner = (s) => `slider-art-${s.key}`;

/* Section heading: eyebrow, title (words rise in), optional lead and action */
function head({ eyebrow, title, id, lead = null, action = null, align = '' }) {
  const t = splitTitle(title);
  return `<div class="svc-head${align ? ` svc-head--${align}` : ''}${action ? ' svc-head--split' : ''}" data-reveal>
      <div>
        <p class="eyebrow">${esc(eyebrow)}</p>
        <h2 class="svc-title" id="${id}"${t.attrs}>${t.html}</h2>
        ${lead ? `<p class="svc-lead">${lead}</p>` : ''}
      </div>
      ${action ? `<div class="svc-head__action">${action}</div>` : ''}
    </div>`;
}


/* ---------------------------------------------------------------- 1. Header */
/* The same full-screen banner as the home page slider (the same classes, 06-hero.css), holding only this
   service's photo: the service, its headline (key words in Brand Orange) and line of text over the left
   of the photo on computers, under it on phones; no buttons, as on Home. Its loops (10-services.css)
   run only while it is on screen (data-live): the photo drifts, a light crosses it, a shine crosses the
   orange words, and the scroll cue at the bottom leads to the overview. */
function hero(s) {
  const copy = HERO_COPY[s.key];
  const key = banner(s);
  const title = esc(copy.title).replace(esc(copy.highlight), `<span class="slide-copy__hl">${esc(copy.highlight)}</span>`);
  return `<section class="hero artwork-slider svc-banner on-dark" aria-labelledby="svc-title" data-live>
  <div class="hero__slides">
    <div class="hero-slider-frame">
      <div class="hero-slide__media">
        <div class="hero-slide__stage" style="--stage-ratio:${IMAGES[key].width} / ${IMAGES[key].height}">${img(key, { cls: 'hero-slide__artwork is-active', sizes: '100vw', priority: true, target: 1672 })}</div>
        <a class="svc-banner__scroll" href="#intro-title" aria-label="Scroll down to the overview"></a>
      </div>
      <div class="slide-copy-panel">
        <div class="container slide-copy-stack">
          <div class="slide-copy slide-copy--${s.key} is-active">
            <p class="eyebrow slide-copy__tag">${esc(copy.category)}</p>
            <h1 class="slide-copy__title" id="svc-title">${title}</h1>
            <p class="slide-copy__text">${esc(copy.text)}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

/* ---------------------------------------------------------------- 2. Overview */
function intro(s, file, mainKey, subKey) {
  const f = S.serviceFeatures(s);
  const shot = (key, cls, sizes, target) => (key
    ? `<figure class="svc-shot ${cls}">${img(key, { sizes, target })}</figure>`
    : '');
  return `<section class="svc-section svc-intro" aria-labelledby="intro-title">
  <div class="svc-container svc-intro__grid">
    <div class="svc-intro__text">
      ${head({ eyebrow: 'Overview', title: esc(s.intro.heading), id: 'intro-title' })}
      <div class="svc-prose" data-reveal>${s.intro.paragraphs.map((p) => `<p>${unlinkSelf(p, file)}</p>`).join('')}</div>
      <div class="svc-features" data-reveal>
        <h3 class="svc-features__title">${esc(f.title)}</h3>
        <ul>${f.list.map((x) => `<li>${icon('check-circle', { size: 18 })}<span>${esc(x)}</span></li>`).join('')}</ul>
      </div>
    </div>
    <div class="svc-intro__media${subKey ? '' : ' svc-intro__media--single'}" data-reveal="img">
      ${shot(mainKey, 'svc-shot--main', '(min-width: 1850px) 580px, (min-width: 1550px) 32vw, (min-width: 1280px) 500px, (min-width: 1024px) 40vw, 92vw', 800)}
      ${shot(subKey, 'svc-shot--sub', '(min-width: 1850px) 290px, (min-width: 1024px) 240px, 40vw', 480)}
    </div>
  </div>
</section>`;
}

/* ---------------------------------------------------------------- Outdoor: the power of outdoor advertising */
function powerSection(s) {
  return `<section class="svc-section svc-power svc-section--navy" aria-labelledby="power-title">
  <div class="svc-container svc-power__grid">
    <figure class="svc-power__media" data-reveal="img">${img('outdoor-bus-stand-boards', { sizes: '(min-width: 1850px) 650px, (min-width: 1024px) 46vw, 100vw', target: 1200 })}</figure>
    <div class="svc-power__text">
      ${head({ eyebrow: s.slide.title, title: esc(s.power.heading), id: 'power-title', lead: esc(s.power.intro) })}
      <ol class="svc-steps">${s.power.items.map((it, i) => `<li data-reveal style="--reveal-delay:${i * 0.08}s"><span class="svc-steps__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><div><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></div></li>`).join('')}</ol>
    </div>
  </div>
</section>`;
}

/* ---------------------------------------------------------------- 3. What we offer */
function offerSection(s) {
  const sub = s.subservices;
  if (!sub) return '';
  let body;
  if (sub.style === 'feature') {
    // Capabilities with a full description: an easy-to-scan two-column list
    body = `<ol class="svc-caps">${sub.items.map((it, i) => `<li class="svc-cap" data-reveal style="--reveal-delay:${(i % 2) * 0.08}s">
        <span class="svc-icon" aria-hidden="true">${icon(it.icon)}</span>
        <div><p class="svc-cap__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</p><h3>${esc(it.name)}</h3><p>${esc(it.text)}</p></div>
      </li>`).join('')}</ol>`;
  } else {
    // Formats with a project photo come first as photo cards; the others as compact icon cards
    const withPhoto = sub.items.filter((it) => it.image);
    const without = sub.items.filter((it) => !it.image);
    const photos = withPhoto.length
      ? `<ul class="svc-tiles svc-tiles--${Math.min(withPhoto.length, 5)}">${withPhoto.map((it, i) => `<li class="svc-tile" data-reveal style="--reveal-delay:${(i % 5) * 0.06}s">
          <div class="svc-tile__media">${img(it.image, { sizes: '(min-width: 1850px) 360px, (min-width: 1024px) 300px, 50vw', target: 480, alt: '' })}</div>
          <div class="svc-tile__body"><h3><span class="svc-tile__icon" aria-hidden="true">${icon(it.icon, { size: 18 })}</span>${esc(it.name)}</h3>${it.text ? `<p>${esc(it.text)}</p>` : ''}</div>
        </li>`).join('')}</ul>`
      : '';
    const list = without.length
      ? `<ul class="svc-chips${without.some((it) => it.text) ? '' : ' svc-chips--plain'}">${without.map((it, i) => `<li class="svc-chip" data-reveal style="--reveal-delay:${(i % 3) * 0.06}s">
          <span class="svc-icon svc-icon--sm" aria-hidden="true">${icon(it.icon)}</span>
          <div><h3>${esc(it.name)}</h3>${it.text ? `<p>${esc(it.text)}</p>` : ''}</div>
        </li>`).join('')}</ul>`
      : '';
    body = photos + list;
  }
  return `<section class="svc-section svc-offer svc-section--cream" aria-labelledby="sub-title">
  <div class="svc-container">
    ${head({ eyebrow: `${s.name} Services`, title: esc(sub.heading), id: 'sub-title', lead: sub.intro ? esc(sub.intro) : null })}
    ${body}
  </div>
</section>`;
}

/* ---------------------------------------------------------------- 4. Benefits, offerings, promise */
function contentSection(s, sec, n) {
  const id = `sec-${n + 1}`;
  if (sec.type === 'offerings') {
    return `<section class="svc-section svc-offerings" aria-labelledby="${id}">
  <div class="svc-container">
    ${head({ eyebrow: 'What We Do', title: esc(sec.heading), id, lead: sec.intro ? esc(sec.intro) : null })}
    <ul class="svc-cards">${sec.items.map((it, i) => `<li class="svc-card" data-reveal style="--reveal-delay:${(i % 4) * 0.07}s">
        <span class="svc-icon" aria-hidden="true">${icon(it.icon)}</span>
        <h3>${esc(it.title)}</h3>
        <p>${esc(it.text)}</p>
      </li>`).join('')}</ul>
  </div>
</section>`;
  }
  if (sec.type === 'values') {
    return `<section class="svc-section svc-promise svc-section--navy" aria-labelledby="${id}">
  <div class="svc-container svc-promise__grid">
    ${head({ eyebrow: 'Our Promise', title: esc(sec.heading), id, lead: esc(sec.intro) })}
    <ul class="svc-promise__list">${sec.items.map((it, i) => `<li data-reveal style="--reveal-delay:${i * 0.1}s">
        <span class="svc-icon svc-icon--light" aria-hidden="true">${icon(it.icon)}</span>
        <div><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></div>
      </li>`).join('')}</ul>
  </div>
</section>`;
  }
  // Benefits: the heading above, the numbered cards below in two columns (one on phones)
  return `<section class="svc-section svc-why" aria-labelledby="${id}">
  <div class="svc-container svc-why__grid">
    <div class="svc-why__head">${head({ eyebrow: 'Benefits', title: esc(sec.heading), id, lead: sec.intro ? esc(sec.intro) : null })}</div>
    <ol class="svc-why__list">${sec.items.map((it, i) => `<li data-reveal style="--reveal-delay:${(i % 2) * 0.06}s">
        <span class="svc-why__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <div><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></div>
      </li>`).join('')}</ol>
  </div>
</section>`;
}

/* ---------------------------------------------------------------- 5. Our work */
/* Size hint of tile i of n equal photos (10-services.css, .svc-bento): from 768px one row of n (4, or 3
   when a service has only three); phones two columns, and with three photos the first goes across. */
function bentoSizes(n, i) {
  const px = (w) => `${Math.round((w - (n - 1) * 16) / n)}px`;
  const phone = n === 3 && i === 0 ? '100vw' : '50vw';
  return `(min-width: 1850px) ${px(1480)}, (min-width: 1550px) ${Math.round(80 / n)}vw, (min-width: 1280px) ${px(1240)}, (min-width: 768px) ${Math.round(100 / n)}vw, ${phone}`;
}

/* A compact row of four project photos (three when that is all there is), each opening larger; "View
   Full Gallery" shows the rest. `title` replaces the default heading (Digital Wall Painting). */
function workSection(s, keys, title = null) {
  if (keys.length < 3) return '';
  const n = keys.length >= 4 ? 4 : 3;
  return `<section class="svc-section svc-work" aria-labelledby="work-title">
  <div class="svc-container">
    ${head({ eyebrow: 'Our Work', title: title ? esc(title) : `Recent ${esc(s.name.toLowerCase())} projects`, id: 'work-title', action: btn({ href: `gallery.html#${s.key}`, label: 'View Full Gallery', variant: 'secondary' }) })}
    <div class="svc-bento svc-bento--${n}">
      ${keys.slice(0, n).map((k, i) => `<div class="svc-bento__item" data-reveal="img" style="--reveal-delay:${i * 0.06}s">${S.galleryItem(k, { group: `work-${s.key}`, sizes: bentoSizes(n, i), showCat: false })}</div>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

/* ---------------------------------------------------------------- 6. Start a project */
/* One navy banner: the closing text on the left (the service's name in orange), on the right four
   contact tiles (both phone numbers, email, WhatsApp) over the service's photo, which fades into the
   navy (10-services.css). Phones: the text, then the tiles. */
function startSection(s, file) {
  const c = s.closing;
  if (!c) return '';
  const heading = c.heading || `Start your ${s.name.toLowerCase()} project`;
  const name = s.name.toLowerCase();
  const at = heading.toLowerCase().indexOf(name);
  const titleHtml = at < 0
    ? esc(heading)
    : `${esc(heading.slice(0, at))}<span class="svc-start__hl">${esc(heading.slice(at, at + name.length))}</span>${esc(heading.slice(at + name.length))}`;
  const t = splitTitle(titleHtml);
  const tile = ({ href, iconName, label, value, external = false }) => `<li><a class="svc-start__tile" href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>
          <span class="svc-start__icon" aria-hidden="true">${icon(iconName, { size: 20 })}</span>
          <span class="svc-start__tile-text"><span class="svc-start__tile-label">${label}</span><span class="svc-start__tile-value">${value}</span></span>${external ? '<span class="sr-only"> (opens in a new tab)</span>' : ''}
        </a></li>`;
  const tiles = [
    ...config.phones.map((p, i) => tile({ href: `tel:${p.tel}`, iconName: 'phone', label: i ? 'Or call' : 'Call us', value: phoneText(p) })),
    tile({ href: `mailto:${config.email}`, iconName: 'mail', label: 'Email us', value: esc(config.email) }),
    tile({ href: esc(waLink), iconName: 'whatsapp', label: 'WhatsApp', value: 'Chat with our team', external: true }),
  ].join('\n        ');
  return `<section class="svc-section svc-start svc-section--cream" aria-labelledby="start-title">
  <div class="svc-container">
    <div class="svc-start__panel on-dark" data-reveal>
      <span class="svc-start__photo" aria-hidden="true">${img(s.hero.image, { sizes: '(min-width: 1024px) 50vw, 100vw', target: 800, alt: '' })}</span>
      <div class="svc-start__text">
        <p class="eyebrow">Get Started</p>
        <h2 class="svc-title" id="start-title"${t.attrs}>${t.html}</h2>
        <div class="svc-prose">${c.paragraphs.map((p) => `<p>${unlinkSelf(p, file)}</p>`).join('')}</div>
      </div>
      <ul class="svc-start__tiles" aria-label="Talk to our team">
        ${tiles}
      </ul>
    </div>
  </div>
</section>`;
}

/* ---------------------------------------------------------------- 7. Other services */
/* The other six services as a turning row of photo cards, laid out like the client's reference: one large
   card in the middle, the ones beside it smaller and behind it on both sides. Every 2 seconds the next
   service comes to the middle (main.js, initServiceFlow), while the row is on screen. The pills above and
   the arrows below bring a service to the middle (a swipe too, on phones); clicking a card opens its page.
   Each card's place is data-pos: 0 the middle, 1 and 2 to the right, -1 and -2 to the left, 3 out of
   sight (10-services.css). Without JavaScript the row stands still. */
const FLOW_SIZES = '(min-width: 1024px) 42vw, (min-width: 640px) 56vw, 74vw';

function flowCard(o, i, n) {
  const pos = i >= n / 2 ? i - n : i;
  return `<article class="svc-flow__card" data-flow-card data-pos="${pos}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${n}">
          <a class="svc-flow__link" href="${o.slug}.html">
            ${img(o.hero.image, { sizes: FLOW_SIZES, target: 800, cls: 'svc-flow__photo', alt: '' })}
            <span class="svc-flow__open" aria-hidden="true">${icon('arrow-up-right')}</span>
            <span class="svc-flow__body">
              <span class="svc-flow__name"><span class="icon-diamond icon-diamond--sm" aria-hidden="true">${icon(o.icon)}</span><span>${esc(o.name)}</span></span>
              <span class="svc-flow__text"><span>${esc(o.short)}</span></span>
            </span>
          </a>
        </article>`;
}

function moreSection(s) {
  const others = services.filter((o) => o.key !== s.key);
  const n = others.length;
  return `<section class="svc-section svc-more" aria-labelledby="other-title">
  <div class="svc-container">
    ${head({ eyebrow: 'Explore More', title: 'Other services', id: 'other-title', lead: 'Take a look at everything else our team can do for your brand.', align: 'center' })}
    <div class="svc-flow" data-flow data-reveal aria-roledescription="carousel" aria-labelledby="other-title">
      <div class="svc-flow__pills" role="group" aria-label="Choose a service">
        ${others.map((o, i) => `<button class="svc-flow__pill" type="button" data-flow-go="${i}" aria-pressed="${i === 0}">${icon(o.icon, { size: 18 })}<span>${esc(o.name)}</span></button>`).join('\n        ')}
      </div>
      <div class="svc-flow__stage">
        ${others.map((o, i) => flowCard(o, i, n)).join('\n        ')}
      </div>
      <div class="svc-flow__controls">
        <button class="svc-flow__arrow" type="button" data-flow-prev aria-label="Previous service">${icon('chevron-left')}</button>
        <button class="svc-flow__arrow svc-flow__arrow--next" type="button" data-flow-next aria-label="Next service">${icon('chevron-right')}</button>
      </div>
      <p class="svc-flow__all"><a class="svc-link" href="service.html">All services ${icon('arrow-right', { size: 18 })}</a></p>
    </div>
  </div>
</section>`;
}

/* The light sections take turns, white then warm cream, so two in a row never share a background
   (navy sections keep their own) */
function alternate(html) {
  let n = 0;
  return html.replace(/<section class="svc-section([^"]*)"/g, (tag, rest) => {
    if (rest.includes('svc-section--navy')) return tag;
    const cls = rest.replace(' svc-section--cream', '');
    return `<section class="svc-section${cls}${n++ % 2 ? ' svc-section--cream' : ''}"`;
  });
}

function servicePage(s) {
  const file = `${s.slug}.html`;
  const copy = HERO_COPY[s.key];
  const crumbs = [
    { label: 'Home', href: 'index.html' },
    { label: 'Services', href: 'service.html' },
    { label: s.name, href: file },
  ];

  // Photos already placed in the page (so the overview and the work gallery never repeat them)
  const used = new Set();
  if (s.subservices) s.subservices.items.forEach((it) => it.image && used.add(it.image));
  if (s.key === 'outdoor') used.add('outdoor-bus-stand-boards');
  const pool = s.gallery && s.gallery.length ? s.gallery : (s.mosaic || []);
  const mainKey = s.intro.image || INTRO_FALLBACK[s.key] || null;
  if (mainKey) used.add(mainKey);
  const subKey = pool.find((k) => !used.has(k)) || null;
  if (subKey) used.add(subKey);

  const parts = [hero(s), intro(s, file, mainKey, subKey)];
  if (s.key === 'outdoor') parts.push(powerSection(s));
  parts.push(offerSection(s));
  s.sections.forEach((sec, n) => parts.push(contentSection(s, sec, n)));
  parts.push(workSection(s, pool.filter((k) => !used.has(k)), s.key === 'wall-painting' ? 'Walls we have painted' : null));
  parts.push(startSection(s, file));
  parts.push(moreSection(s));

  return {
    path: file,
    def: {
      path: file,
      nav: 'services',
      navSub: true,
      serviceKey: s.key,
      bodyClass: `page-service page-service--${s.key}`,
      title: s.seo.title,
      description: s.seo.description,
      ogImage: srcFor(copy.image, 1200),
      preload: [{ srcset: srcsetFor(banner(s)), sizes: '100vw' }],
      jsonld: [seo.breadcrumbs(crumbs), seo.service(s)],
    },
    main: alternate(parts.filter(Boolean).join('\n\n')),
  };
}

module.exports = function serviceDetails() {
  return services.map(servicePage);
};
