/**
 * Reusable UI components (cards, section headings, heroes, CTA bands, forms…).
 */
const config = require('../config');
const site = require('../content/site');
const services = require('../content/services.json');
const { esc, attrs, icon, img, btn, image, fullSrc, srcFor, srcsetFor, setSrc, setSrcset, excerpt, splitTitle, PIXEL } = require('./helpers');
const { primaryPhone, phoneText } = require('./layout');

const CATEGORY_LABELS = Object.fromEntries(site.galleryCategories.map((c) => [c.key, c.label]));

/* ------------------------------------------------------------ decorations */
function decoBars(cls = '') {
  return `<svg class="deco deco-bars ${cls}" viewBox="0 0 170 170" aria-hidden="true" focusable="false"><rect x="-12" y="92" width="150" height="26" rx="4" transform="rotate(-45 63 105)"/><rect x="44" y="118" width="116" height="26" rx="4" transform="rotate(-45 102 131)" opacity=".85"/></svg>`;
}

function deco(name, cls = '', style = '') {
  return `<span class="deco deco-${name} ${cls}"${style ? ` style="${style}"` : ''} aria-hidden="true"></span>`;
}

/* ------------------------------------------------------------ headings */
function sectionHead({ eyebrow, title, lead = null, align = 'left', action = null, id = null, tag = 'h2', reveal = true }) {
  const cls = ['section-head', align === 'center' ? 'section-head--center' : '', action ? 'section-head--split' : ''].filter(Boolean).join(' ');
  const t = splitTitle(title);
  const inner = `${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
      <${tag} class="section-title"${id ? ` id="${id}"` : ''}${t.attrs}>${t.html}</${tag}>
      ${lead ? `<p class="lead">${lead}</p>` : ''}`;
  if (action) {
    return `<div class="${cls}"${reveal ? ' data-reveal' : ''}><div>${inner}</div><div>${action}</div></div>`;
  }
  return `<div class="${cls}"${reveal ? ' data-reveal' : ''}>${inner}</div>`;
}

/* ------------------------------------------------------------ hero media */
function heroMedia(mainKey, insetKey, { label = null, priority = false, deferred = false, sizes = '(min-width: 1280px) 640px, (min-width: 1024px) 50vw, 100vw' } = {}) {
  return `<div class="hero-media">
      ${deco('dots')}
      <div class="hero-media__main">
        ${img(mainKey, { sizes, priority, deferred, target: 1200 })}
        ${label ? `<span class="hero-media__label"><span class="diamond" aria-hidden="true"></span>${esc(label)}</span>` : ''}
      </div>
      ${insetKey ? `<div class="hero-media__inset">${img(insetKey, { sizes: '190px', deferred, target: 480, alt: '' })}</div>` : ''}
    </div>`;
}

/* Photo + round inset cut out of a home slider banner (transparent background; see src/tools/hero_banners.py) */
function heroCutout(set, { alt = '', sizes = '100vw', priority = false } = {}) {
  return `<div class="hero-cutout">
      ${deco('dots')}
      <img${attrs({
        src: setSrc(set, 800),
        srcset: setSrcset(set),
        sizes,
        width: set.width,
        height: set.height,
        alt,
        loading: priority ? 'eager' : 'lazy',
        decoding: 'async',
        fetchpriority: priority ? 'high' : null,
      })}>
    </div>`;
}

function pageHero({ eyebrow = null, title, lead = null, buttons = '', media = '', meta = '', variant = '', backdrop = '' }) {
  const hasMedia = Boolean(media);
  const t = splitTitle(title);
  return `<section class="page-hero on-dark ${hasMedia ? 'page-hero--media' : ''}${backdrop ? ' page-hero--photo' : ''} ${variant}">
  ${backdrop ? `<div class="page-hero__backdrop" aria-hidden="true">${backdrop}</div>` : ''}
  <div class="container page-hero__grid">
    <div class="page-hero__content">
      ${eyebrow ? `<p class="eyebrow" style="margin:0">${esc(eyebrow)}</p>` : ''}
      <h1${eyebrow ? ' style="margin-top:10px"' : ''}${t.attrs}>${t.html}</h1>
      ${meta}
      ${lead ? `<p class="page-hero__lead">${lead}</p>` : ''}
      ${buttons ? `<div class="btn-row">${buttons}</div>` : ''}
    </div>
    ${hasMedia ? `<div class="page-hero__media">${media}</div>` : ''}
  </div>
</section>`;
}

/* ------------------------------------------------------------ cards */
const SERVICE_CARD_SIZES = '(min-width: 1280px) 300px, (min-width: 1024px) 24vw, (min-width: 640px) 50vw, 100vw';

/* What a service includes, as a titled list: its features from services.json; Digital Wall Painting
   has none, so it lists the spaces its intro names. Used by the service page ("Service Features" box,
   header points) and the Services overview ("All services and what they include"). */
function serviceFeatures(s) {
  return s.features && s.features.length
    ? { title: 'Service Features', list: s.features }
    : { title: 'Transform Any Space', list: ['Home', 'Office', 'Restaurant', 'Commercial Establishment'] };
}

/* Service card. With several photos, they are stacked and shown in turn (see main.js);
   the extra photos are decorative (alt="") and load only when the cards come into view. */
function serviceCard(s, i, { photos = null, sizes = SERVICE_CARD_SIZES } = {}) {
  const list = photos && photos.length ? photos : [s.hero.image];
  const pics = list
    .map((key, n) => (n === 0
      ? img(key, { sizes, target: 480, cls: 'card__photo is-shown' })
      : img(key, { sizes, target: 480, cls: 'card__photo', deferred: true, alt: '' })))
    .join('\n          ');
  return `<article class="card service-card"${list.length > 1 ? ' data-cycle' : ''} data-reveal style="--c2:${i % 2};--c4:${i % 4}">
      <div class="card__media">
        <div class="card__photos">
          ${pics}
        </div>
      </div>
      <div class="card__body">
        <span class="icon-diamond">${icon(s.icon)}</span>
        <h3 class="card__title"><a class="stretched-link" href="${s.slug}.html">${esc(s.name)}</a></h3>
        <p class="card__text">${esc(s.short)}</p>
        <div class="card__foot"><span class="link-arrow" aria-hidden="true">Explore ${icon('arrow-right')}</span></div>
      </div>
    </article>`;
}

function ctaCard({ title = 'Not sure where to start?', text = 'Talk to our team about your brand and we will suggest the right mix of media.', delay = 0.21, details = false, style = null } = {}) {
  // details: true = phones, email and city; 'phones' = the phone numbers only
  const info = details
    ? `<ul class="cta-card__list">
          ${config.phones.map((p) => `<li>${icon('phone')}<a href="tel:${p.tel}">${phoneText(p)}</a></li>`).join('')}
          ${details === 'phones' ? '' : `<li>${icon('mail')}<a href="mailto:${config.email}">${esc(config.email)}</a></li>
          <li>${icon('map-pin')}<span>${esc(config.address.city)}, ${esc(config.address.region)}</span></li>`}
        </ul>`
    : '';
  return `<div class="cta-card on-dark" data-reveal style="${style || `--reveal-delay:${delay}s`}">
      <div>
        <h3>${esc(title)}</h3>
        <p>${esc(text)}</p>
        ${info}
      </div>
      <div class="btn-row">
        ${btn({ href: 'contact.html', label: 'Talk to Our Team', variant: 'primary' })}
        ${btn({ href: `tel:${primaryPhone.tel}`, label: 'Call Us', variant: 'light', iconLeft: 'phone', iconName: null })}
      </div>
    </div>`;
}

function featureCard({ iconName, title, text, num = null, delay = 0, headingTag = 'h3' }) {
  return `<article class="feature-card" data-reveal style="--reveal-delay:${delay}s">
      ${num ? `<span class="feature-card__num" aria-hidden="true">${num}</span>` : ''}
      <span class="icon-diamond">${icon(iconName)}</span>
      <${headingTag}>${esc(title)}</${headingTag}>
      ${text ? `<p>${text}</p>` : ''}
    </article>`;
}

function subCard(item, { sizes = '(min-width: 1280px) 290px, (min-width: 1024px) 24vw, (min-width: 640px) 50vw, 100vw', delay = 0, badge = null } = {}) {
  const media = item.image
    ? img(item.image, { sizes, target: 480 })
    : `<div class="sub-card__tile" aria-hidden="true"><span class="icon-diamond">${icon(item.icon)}</span></div>`;
  return `<article class="card sub-card" data-reveal style="--reveal-delay:${delay}s">
      <div class="card__media">${media}${item.image && badge ? `<span class="sub-card__badge">${icon(item.icon, { size: 14 })}${esc(badge)}</span>` : ''}</div>
      <div class="card__body">
        <h3 class="card__title">${esc(item.name)}</h3>
        ${item.text ? `<p class="card__text">${esc(item.text)}</p>` : ''}
      </div>
    </article>`;
}

/* Blog card: the photo with the post's topic (the name of its service) on it, the title, a short excerpt
   and "Read More" (no date or reading time). `k` is the card's turn in the blog page's loop. */
function blogCard(post, { headingTag = 'h3', delay = 0, k = null, sizes = '(min-width: 1200px) 400px, (min-width: 768px) 50vw, 100vw' } = {}) {
  const first = post.body.find((b) => b.p);
  const topic = blogTopic(post);
  return `<article class="card blog-card" data-reveal style="--reveal-delay:${delay}s${k === null ? '' : `;--k:${k}`}">
      <div class="card__media">${img(post.image, { sizes, target: 800 })}${topic ? `<span class="blog-topic blog-card__topic">${esc(topic)}</span>` : ''}</div>
      <div class="card__body">
        <${headingTag} class="card__title"><a class="stretched-link" href="${post.slug}.html">${esc(post.title)}</a></${headingTag}>
        <p class="card__text">${esc(excerpt(first ? first.p : '', 150))}</p>
        <div class="card__foot"><span class="link-arrow" aria-hidden="true">Read More ${icon('arrow-right')}</span></div>
      </div>
    </article>`;
}

/* The topic of a blog post: the name of the service it is about (blog.json `service`) */
function blogTopic(post) {
  const s = services.find((x) => x.key === post.service);
  return s ? s.name : '';
}

/* The byline of a blog post, when it has an author (the site shows no dates or reading times; the
   publish date stays in the article's structured data for search engines) */
function postMeta(post) {
  return post.author
    ? `<p class="post-meta"><span>${icon('user')}By ${esc(post.author)}</span></p>`
    : '';
}

/* A gallery tile that opens the lightbox */
function galleryItem(key, { group = 'gallery', sizes = '(min-width: 1280px) 300px, (min-width: 900px) 33vw, (min-width: 560px) 50vw, 100vw', showCat = true, loading = 'lazy' } = {}) {
  const im = image(key);
  const cat = im.category ? CATEGORY_LABELS[im.category] : '';
  const label = showCat && cat ? `${cat}: ${im.alt} — view larger` : `${im.alt} — view larger`;
  return `<button class="g-item" type="button" data-lightbox="${group}" data-full="${fullSrc(key)}" data-alt="${esc(im.alt)}" data-cat="${esc(cat)}" aria-label="${esc(label)}">
        ${img(key, { sizes, target: 480, loading })}
        <span class="g-item__overlay" aria-hidden="true">${showCat && cat ? `<span class="g-item__cat">${esc(cat)}</span>` : '<span></span>'}<span class="g-item__zoom">${icon('zoom-in')}</span></span>
      </button>`;
}

/* ------------------------------------------------------------ sections */
/* How we work (Home, Services; 07-sections.css): the four steps on one thin line, in a row on
   computers and down the left on phones and tablets. A small orange diamond (the brief) travels the
   line from step to step, the line fills in orange behind it, and each step lights up while the
   diamond rests on it; one round takes 8 seconds and plays only while the section is on screen
   (data-live; 08-motion.css). With reduced motion everything is shown still. */
const JOURNEY_LEAD = 'A simple and collaborative process to turn your ideas into impactful branding, printing and advertising solutions.';

function journeySection() {
  const steps = site.process
    .map((st, i) => `<li class="journey__step" style="--step:${i}">
        <span class="journey__node" aria-hidden="true">${icon(st.icon)}</span>
        <h3><span class="sr-only">Step ${i + 1}: </span>${esc(st.title)}</h3>
        <p class="journey__text">${esc(st.text)}</p>
      </li>`)
    .join('');
  return `<section class="section section--page journey" aria-labelledby="process-title" data-live>
  <div class="container">
    ${sectionHead({ eyebrow: 'How We Work', title: 'From brief <span class="journey__hl">to delivery</span>', lead: esc(JOURNEY_LEAD), id: 'process-title', align: 'center' })}
    <div class="journey__flow" data-reveal>
      <div class="journey__track" aria-hidden="true"><span class="journey__fill"></span><span class="journey__runner"><span></span></span></div>
      <ol class="journey__steps">${steps}</ol>
    </div>
  </div>
</section>`;
}

/* Need a consultation: a rounded card below How we work (Home, Services) and at the end of About
   (07-sections.css). The photo of an adviser with a client fills it and fades into navy on the left,
   where the eyebrow, "Need a" over "Consultation?" and Get a Quote sit.
   Its highlights loop while it is on screen (data-live; 08-motion.css). */
function consultBand() {
  return `<section class="consult" aria-labelledby="consult-title" data-live>
  <div class="container">
    <div class="consult__band on-dark" data-reveal>
      <div class="consult__media" aria-hidden="true">${img('consult-photo', { sizes: '(min-width: 1560px) 1480px, (min-width: 768px) 100vw, 190vw', target: 1440, alt: '' })}</div>
      <span class="consult__shine" aria-hidden="true"></span>
      <div class="consult__inner">
        <div class="consult__text">
          <p class="consult__eyebrow">We are here to answer your questions 24/7</p>
          <h2 class="consult__title" id="consult-title">Need a <span>Consultation?</span></h2>
        </div>
        ${btn({ href: 'contact.html', label: 'Get a Quote', variant: 'accent', size: 'lg', cls: 'consult__btn' })}
      </div>
    </div>
  </div>
</section>`;
}

function mapFrame() {
  return `<div class="map-frame" data-reveal>
      <iframe src="${esc(config.map.embed)}" title="Brand Image Media Pvt Ltd office location on Google Maps" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
    </div>`;
}

function contactForm({ id = 'contact-form', selected = '' } = {}) {
  const options = services
    .map((s) => `<option value="${esc(s.name)}" data-key="${s.key}"${selected === s.key ? ' selected' : ''}>${esc(s.name)}</option>`)
    .join('');
  const err = (msg) => `<span class="field__error" id="${msg.id}">${esc(msg.text)}</span>`;
  // Length limits, set on the fields as minlength / maxlength; main.js checks the same attributes.
  // The phone field holds a 10-digit Indian mobile number, with or without +91 / 0 and spaces.
  const LIMITS = { name: [2, 50], email: [6, 100], phone: [10, 16], message: [10, 1000] };
  const field = ({ name, label, type = 'text', autocomplete, placeholder, inputmode = null, textarea = false, select = false }) => {
    const errId = `${id}-${name}-error`;
    const [min, max] = LIMITS[name] || [];
    const common = {
      id: `${id}-${name}`,
      name,
      class: 'input',
      required: true,
      'aria-required': 'true',
      'aria-describedby': errId,
      autocomplete,
      minlength: min,
      maxlength: max,
    };
    let control;
    if (textarea) {
      control = `<textarea${attrs({ ...common, rows: 5, placeholder })}></textarea>`;
    } else if (select) {
      control = `<select${attrs(common)}><option value=""${selected ? '' : ' selected'} disabled>Select a service</option>${options}<option value="Other / Not sure">Other / Not sure</option></select>`;
    } else {
      control = `<input${attrs({ ...common, type, placeholder, inputmode })}>`;
    }
    const messages = {
      name: 'Please enter a valid name.',
      email: 'Please enter a valid email.',
      phone: 'Please enter a valid mobile number.',
      service: 'Please choose a service.',
      message: 'Please enter your message.',
    };
    return `<div class="field">
          <label for="${id}-${name}">${esc(label)}<span class="req" aria-hidden="true">*</span></label>
          ${control}
          ${err({ id: errId, text: messages[name] })}
        </div>`;
  };
  return `<form class="form" id="${id}" data-contact-form novalidate data-endpoint="${esc(config.contactFormEndpoint)}" data-email="${esc(config.email)}" data-whatsapp="${esc(config.whatsapp.number)}"${config.contactFormEndpoint ? ` action="${esc(config.contactFormEndpoint)}" method="post"` : ''}>
      <div class="form__row form__row--2">
        ${field({ name: 'name', label: 'Name', autocomplete: 'name', placeholder: 'Your full name' })}
        ${field({ name: 'email', label: 'Email', type: 'email', autocomplete: 'email', placeholder: 'you@example.com' })}
      </div>
      <div class="form__row form__row--2">
        ${field({ name: 'phone', label: 'Phone', type: 'tel', autocomplete: 'tel', placeholder: '+91 00000 00000', inputmode: 'tel' })}
        ${field({ name: 'service', label: 'Service', select: true })}
      </div>
      ${field({ name: 'message', label: 'Message', textarea: true, placeholder: 'Tell us about your brand, location and timeline' })}
      <div class="form__hp" aria-hidden="true"><label for="${id}-hp">Leave this field empty</label><input id="${id}-hp" type="text" name="_hp" tabindex="-1" autocomplete="off"></div>
      ${config.recaptchaSiteKey ? `<div class="field field--captcha" data-captcha>
        <div class="g-recaptcha" data-sitekey="${esc(config.recaptchaSiteKey)}" data-callback="biCaptchaChanged" data-expired-callback="biCaptchaChanged" data-error-callback="biCaptchaChanged"></div>
        <span class="field__error" id="${id}-captcha-error">Please tick “I’m not a robot”.</span>
      </div>
      <script src="https://www.google.com/recaptcha/api.js" async defer></script>` : ''}
      <div class="form-status" data-form-status role="status" aria-live="polite"></div>
      <div class="btn-row">
        <button class="btn btn--primary btn--lg" type="submit"><span>Send Enquiry</span>${icon('send')}</button>
      </div>
      ${config.contactFormEndpoint ? '' : '<p class="form__note">Sending opens your email app with your enquiry filled in — nothing is stored on this website.</p>'}
    </form>`;
}

function otherServices(currentKey) {
  return services
    .filter((s) => s.key !== currentKey)
    .map((s, i) => `<li data-reveal style="--reveal-delay:${i * 0.05}s"><a class="capability" href="${s.slug}.html"><span class="icon-diamond icon-diamond--sm">${icon(s.icon)}</span><span>${esc(s.name)}</span>${icon('arrow-right', { cls: 'icon--arrow' })}</a></li>`)
    .join('');
}

module.exports = {
  decoBars, deco, sectionHead, heroMedia, heroCutout, pageHero, serviceCard, serviceFeatures, ctaCard, featureCard, subCard,
  blogCard, blogTopic, postMeta, galleryItem, journeySection, consultBand,
  mapFrame, contactForm, otherServices, CATEGORY_LABELS,
};
