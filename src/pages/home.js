const site = require('../content/site');
const services = require('../content/services.json');
const { IMAGES, esc, attrs, icon, img, btn, splitTitle, srcsetFor } = require('../components/helpers');
const S = require('../components/sections');
const seo = require('../components/seo');
const React = require('react');
const { renderToString } = require('react-dom/server');
const HeroSlider = require('../components/hero-slider');
const HERO_COPY = require('../content/hero-copy');

/* The slider photos in Slider images, one per service, with no text of their own (the site uses WebP
   copies made by `node src/tools/render_artwork.js slider`). Each slide's words are the service's
   hero copy (src/content/hero-copy.js, as on its service page). */
const HERO_ARTWORK = {
  printing: { image: 'slider-art-printing', label: 'Printing', alt: 'Brand Image printing services' },
  'shop-branding': { image: 'slider-art-shop-branding', label: 'Shop Branding', alt: 'Brand Image shop branding services' },
  outdoor: { image: 'slider-art-outdoor', label: 'Outdoor Advertising', alt: 'Brand Image outdoor advertising services' },
  transit: { image: 'slider-art-transit', label: 'Transit Media', alt: 'Brand Image transit media advertising' },
  'wall-painting': { image: 'slider-art-wall-painting', label: 'Digital Wall Painting', alt: 'Brand Image digital wall painting services' },
  events: { image: 'slider-art-events', label: 'Event & Promotion', alt: 'Brand Image event and promotional services' },
  promotional: { image: 'slider-art-promotional', label: 'Promotional Material', alt: 'Brand Image promotional material services' },
};

/* The home page header is the slider of the seven services (src/components/hero-slider.js): a new slide
   every 2 seconds, without end, with no dots or arrows (the client asked for them to be removed). Set
   SHOW_SLIDER to false to show only the first photo (Printing), as one link to its service page. */
const SHOW_SLIDER = true;

function heroBanner() {
  const service = services.find((s) => HERO_ARTWORK[s.key]);
  const artwork = HERO_ARTWORK[service.key];
  const image = IMAGES[artwork.image];
  const src = `${image.path}-${image.widths[image.widths.length - 1]}.${image.format || 'webp'}`;
  return `<section class="hero artwork-slider on-dark" aria-label="${esc(artwork.label)}">
  <h1 class="hero__kicker sr-only">Brand Image Media Pvt Ltd — Printing, Branding &amp; Advertising Agency in Nashik</h1>
  <div class="hero__slides">
    <div class="hero-slider-frame">
      <a class="hero-slide__link" href="${service.slug}.html" aria-label="Explore ${esc(artwork.label)}">
        <div class="hero-slide__stage"><img${attrs({ class: 'hero-slide__artwork is-active', src, srcset: srcsetFor(artwork.image), sizes: '100vw', width: image.width, height: image.height, alt: artwork.alt, fetchpriority: 'high', decoding: 'async' })}></div>
      </a>
    </div>
  </div>
</section>`;
}

/* The slider: the first photo is in the page's HTML and the others are loaded in turn by the slider
   script (hero-slider.min.js), each at the size the screen needs (800, 1280 or 1672 px wide). Every
   slide names its service, with the service's headline (the key words in Brand Orange, 06-hero.css)
   and its line of text. */
function heroSlider() {
  const sliderServices = services.filter((service) => HERO_ARTWORK[service.key]);
  const slides = sliderServices.map((service) => {
    const artwork = HERO_ARTWORK[service.key];
    const image = IMAGES[artwork.image];
    const copy = HERO_COPY[service.key];
    return {
      key: service.key,
      src: `${image.path}-${image.widths[image.widths.length - 1]}.${image.format || 'webp'}`,
      srcset: srcsetFor(artwork.image),
      sizes: '100vw',
      alt: artwork.alt,
      label: artwork.label,
      href: `${service.slug}.html`,
      width: image.width,
      height: image.height,
      name: service.name,
      title: esc(copy.title).replace(esc(copy.highlight), `<span class="slide-copy__hl">${esc(copy.highlight)}</span>`),
      text: copy.text,
    };
  });
  const markup = renderToString(React.createElement(HeroSlider, { slides }));
  return `<div id="homepage-hero-root" data-slides="${esc(JSON.stringify(slides))}">${markup}</div>`;
}

/* About: the office and a printer in a layered photo collage, with the years of experience on an
   orange card; beside it the quote and the introduction. */
function aboutSection() {
  const a = site.about;
  // the quote on two lines: the quoted words (and the full stop) in orange
  const q = esc(a.quote);
  const at = q.indexOf('“');
  const heading = at > 0
    ? `${q.slice(0, at).trim()}<br><span class="about__hl">${q.slice(at)}</span>`
    : q;
  const t = splitTitle(heading);
  // the first sentence of the intro is the lead
  const intro = a.paragraphs[0];
  const cut = intro.indexOf('. ') + 1;
  const lead = cut > 0 ? intro.slice(0, cut) : intro;
  const rest = cut > 0 ? intro.slice(cut).trim() : '';
  const exp = a.experience;
  return `<section class="section about-home" aria-labelledby="about-title" data-live>
  <div class="container about">
    <div class="about__collage" data-reveal="collage">
      <div class="collage">
        <figure class="collage__photo collage__photo--main">${img('office-reception', { sizes: '(min-width: 1024px) 620px, 80vw', target: 495 })}</figure>
        <figure class="collage__photo collage__photo--second">${img('print-machine', { sizes: '(min-width: 1024px) 380px, 50vw', target: 480 })}</figure>
        <p class="collage__card">
          ${icon('users', { cls: 'collage__card-icon' })}
          <span class="collage__card-value" data-count="${exp.value}" data-suffix="${exp.suffix}">${exp.value}${exp.suffix}</span>
          <span class="collage__card-label">Years of Experience</span>
        </p>
      </div>
    </div>
    <div class="about__content">
      <div class="about__head" data-reveal>
        <p class="eyebrow about__eyebrow">${esc(a.eyebrow)}</p>
        <h2 class="about__title" id="about-title"${t.attrs}>${t.html}</h2>
      </div>
      <div class="about__body" data-reveal>
        <p class="about__lead">${esc(lead)}</p>
        ${rest ? `<p class="about__text">${esc(rest)}</p>` : ''}
      </div>
    </div>
  </div>
</section>`;
}

/* Photos shown in turn on each service card: the service's main photo first, then these
   project photos (keys from src/content/images.json). A service not listed here gets two more of
   its own landscape photos automatically. */
const CARD_PHOTOS = {
  printing: ['print-smart-posters', 'print-instore-branding'],
  'shop-branding': ['shop-arch-vivo', 'shop-bosch-board'],
  outdoor: ['outdoor-mall-backlit', 'outdoor-highway-hoarding'],
  transit: ['transit-led-van', 'transit-mahindra-van'],
  'wall-painting': ['wall-work-1', 'wall-work-2'],
  events: ['event-launch-stage', 'event-hall'],
  promotional: ['promo-standees', 'promo-vivo-bag'],
};

function cardPhotos(s) {
  const picked = (CARD_PHOTOS[s.key] || []).filter((k) => IMAGES[k]);
  if (picked.length) return [s.hero.image, ...picked];
  const own = Object.keys(IMAGES).filter((k) => IMAGES[k].category === s.key && k !== s.hero.image);
  const wide = (k) => IMAGES[k].width / IMAGES[k].height >= 1.25 && IMAGES[k].width / IMAGES[k].height <= 1.6;
  return [s.hero.image, ...own.filter(wide).slice(0, 2)];
}

function servicesSection() {
  return `<section class="section section--soft" id="services" aria-labelledby="services-title">
  <div class="container">
    ${S.sectionHead({
      eyebrow: site.servicesIntro.eyebrow,
      title: 'We help you to establish your <span class="live-hl">Brand</span> presence',
      id: 'services-title',
      action: btn({ href: 'service.html', label: 'Explore Services', variant: 'secondary' }),
    })}
    <div class="grid grid--4 service-grid">
      ${services.map((s, i) => S.serviceCard(s, i, { photos: cardPhotos(s) })).join('\n      ')}
      ${S.ctaCard({ details: 'phones', style: `--c2:${services.length % 2};--c4:${services.length % 4}` })}
    </div>
  </div>
</section>`;
}

/* Why choose us: the copy on the left; on the right a mosaic of three project photos that fills the
   column from top to bottom, one for each word of the heading: activation (the promotion team, tall
   on the left), branding (a showroom entrance) and advertising (display boards at a bus stand). Each
   photo pans slowly and a soft light crosses them in turn (08-motion.css). */
const WHY_PHOTOS = [
  { key: 'event-gulf-team', name: 'team', sizes: '(min-width: 1024px) 340px, 52vw' },
  { key: 'shop-hero-showroom', name: 'shop', sizes: '(min-width: 1024px) 300px, 46vw' },
  { key: 'outdoor-bus-stand-boards', name: 'outdoor', sizes: '(min-width: 1024px) 300px, 46vw' },
];

function whySection() {
  const w = site.whyUs;
  const title = esc(w.title).replace('branding, advertising', '<span class="why-visual__highlight">branding, advertising</span>');
  const tiles = WHY_PHOTOS
    .map((p, k) => `<figure class="why-visual__tile why-visual__tile--${p.name}" style="--k:${k}">${img(p.key, { sizes: p.sizes, target: 800 })}</figure>`)
    .join('\n      ');
  return `<section class="section why-visual" aria-labelledby="why-title" data-live>
  <div class="container why-visual__layout">
    <div class="why-visual__content" data-reveal>
      <p class="eyebrow why-visual__eyebrow">${esc(w.eyebrow)}</p>
      <h2 class="why-visual__title" id="why-title">${title}</h2>
      <p class="why-visual__intro">${w.intro}</p>
    </div>
    <div class="why-visual__mosaic" data-reveal>
      ${tiles}
    </div>
  </div>
</section>`;
}

module.exports = function home() {
  const first = services[0];
  const main = [
    SHOW_SLIDER ? heroSlider() : heroBanner(),
    aboutSection(),
    servicesSection(),
    whySection(),
    S.journeySection(),
    S.consultBand(),
  ].join('\n\n');
  return [{
    path: 'index.html',
    def: {
      path: 'index.html',
      nav: 'home',
      bodyClass: 'page-home',
      heroSlider: SHOW_SLIDER,
      title: 'Printing | Branding | Outdoor Advertising Agency Nashik | Brand Image',
      description: 'Elevate your brand image with our comprehensive services. We specialize in printing, branding, and outdoor advertising in Nashik, delivering impactful solutions for your business.',
      preload: [{ srcset: srcsetFor(HERO_ARTWORK[first.key].image), sizes: '100vw' }],
      jsonld: [seo.organization(), seo.website()],
    },
    main,
  }];
};
