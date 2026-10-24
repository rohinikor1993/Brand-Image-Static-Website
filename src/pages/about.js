const config = require('../config');
const site = require('../content/site');
const { esc, icon, img, splitTitle } = require('../components/helpers');
const S = require('../components/sections');
const seo = require('../components/seo');
const { primaryPhone, phoneText } = require('../components/layout');

/* About page. Every section has its own layout and its own looping highlight (09-about.css): the
   loops run only while the section is on screen (data-live, see main.js) and never with "reduce
   motion". All wording is the existing About / home page copy (src/content/site.js). */

const MARK = 'assets/img/brand/brand-image-mark.png';

/* The mission with its key phrases in orange and the words of its last sentence (strategy,
   creativity, technology) marked, so each can light up with its icon below it (09-about.css). */
function missionHtml(text, keys, words) {
  let html = esc(text);
  keys.forEach((p) => { html = html.replace(esc(p), `<span class="ab-mission__key">${esc(p)}</span>`); });
  words.forEach((w, k) => { html = html.replace(new RegExp(`\\b${w}\\b`), `<span class="ab-mission__word" style="--k:${k}">${w}</span>`); });
  return html;
}

module.exports = function about() {
  const a = site.about;
  const crumbs = [{ label: 'Home', href: 'index.html' }, { label: 'About Us', href: 'about.html' }];
  /* ---------------------------------------------------------------- Hero: the compact photo header */
  // (like the Gallery's): one real project photo behind the title and tagline, the corporate event
  // hall (decorative: it is also in the gallery)
  const hero = S.pageHero({
    crumbs,
    title: 'About <span class="hl">Brand Image</span>',
    lead: esc(config.company.tagline),
    variant: 'page-hero--about',
    backdrop: img('event-hall', { sizes: '100vw', target: 1600, priority: true, alt: '' }),
  });

  /* ---------------------------------------------------------------- Who we are */
  // Editorial two-column block (09-about.css, .about-who-we-are): the office photos on the left, the
  // quote, the welcome text and three feature cards on the right. On phones: heading, photos, text.
  // The welcome copy is unchanged; it is only split into the greeting, an introduction (its first two
  // sentences) and the rest.
  const [welcomeFirst, ...welcomeRest] = a.welcome.split(/(?<=!)\s+/);
  const sentences = welcomeRest.join(' ').split(/(?<=\.)\s+/);
  const wwa = a.whoWeAre;
  const quote = esc(a.quote)
    .replace(' – ', '&nbsp;– ') // the dash never starts a line
    // “marketing in orange, “and” in the heading's dark colour, innovation” in blue
    .replace(/(“[^”]+”)/, (words) => {
      const [first, middle, ...rest] = words.split(' ');
      return `<span class="about-headline__hl">${first}</span> ${middle} <span class="about-headline__em">${rest.join(' ')}</span>`;
    });
  const intro = `<section class="section about-who-we-are" aria-labelledby="intro-title" data-live>
  <div class="about-who-we-are__inner">
    <div class="about-content about-content--head" data-reveal>
      <p class="eyebrow about-eyebrow">Who We Are</p>
      <h2 class="about-headline" id="intro-title">${quote}</h2>
    </div>
    <div class="about-visual" data-reveal="left">
      <figure class="about-visual__main">${img('office-reception', { sizes: '(min-width: 1024px) 560px, 92vw', target: 495 })}</figure>
      <figure class="about-visual__second">${img('office-wall', { sizes: '(min-width: 1024px) 220px, 36vw', target: 261 })}</figure>
      <div class="about-experience-badge">
        <span class="about-experience-badge__value" data-count="${a.experience.value}" data-suffix="${a.experience.suffix}">${a.experience.value}${a.experience.suffix}</span>
        <span class="about-experience-badge__label">Years of<br>Experience</span>
      </div>
    </div>
    <div class="about-content about-content--body" data-reveal="right">
      <p class="about-welcome">${wwa ? esc(wwa.greeting) : esc(welcomeFirst)}</p>
      ${wwa
        ? wwa.paragraphs.map((p) => `<p class="about-text">${p}</p>`).join('\n      ')
        : `<p class="about-text">${esc(sentences.slice(0, 2).join(' '))}</p>
      <p class="about-text">${esc(sentences.slice(2).join(' '))}</p>`
      }
      <ul class="about-features">
        ${a.highlights.map((h) => `<li class="about-feature-card about-feature-card--${h.tone}">
          <span class="about-feature-card__icon" aria-hidden="true">${icon(h.icon)}</span>
          <span><span class="about-feature-card__title">${esc(h.title)}</span><span class="about-feature-card__text">${esc(h.text)}</span></span>
        </li>`).join('')}
      </ul>
      <p class="about-contact">
        <span class="about-contact__label">Call To Ask Any Query</span>
        <a href="tel:${primaryPhone.tel}">${icon('phone')}${phoneText(primaryPhone)}</a>
        <a href="mailto:${config.email}">${icon('mail')}${esc(config.email)}</a>
      </p>
    </div>
  </div>
</section>`;

  /* ---------------------------------------------------------------- Core strengths */
  const cycleTitle = splitTitle('<span class="ab-strengths__hl ab-strengths__hl--blue">Printing,</span> <span class="ab-strengths__hl ab-strengths__hl--orange">Retail Branding,</span> <span class="ab-strengths__hl ab-strengths__hl--navy">Outdoor Advertising</span> &amp; <span class="ab-strengths__hl ab-strengths__hl--deep-orange">Events</span>');
  const strengths = `<section class="section section--soft ab-strengths" aria-labelledby="strengths-title" data-live>
  <div class="container">
    <div class="section-head section-head--center" data-reveal>
      <p class="eyebrow">Core Strengths</p>
      <h2 class="section-title" id="strengths-title"${cycleTitle.attrs}>${cycleTitle.html}</h2>
      <p class="lead">${config.company.footerDesc}</p>
    </div>
    <div class="ab-strengths__grid">
      ${a.strengths.map((st, i) => `<article class="ab-power" data-reveal style="--reveal-delay:${i * 0.1}s;--k:${i}">
        <span class="ab-power__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <span class="icon-diamond icon-diamond--lg">${icon(st.icon)}</span>
        <h3>${esc(st.title)}</h3>
        <p>${esc(a.paragraphs[st.textIndex])}</p>
      </article>`).join('')}
    </div>
  </div>
</section>`;

  /* ---------------------------------------------------------------- Mission */
  // Vision statement: not present in the existing website content, so it is not shown.
  // When the team provides one, add a block here next to the mission.
  // Centred: the heading, the mission in full under an orange quote mark (key phrases in orange),
  // then Strategy, Creativity and Technology in a row. The three light up in turn and, as each
  // does, its word in the mission is underlined in orange (09-about.css).
  const focus = [
    { label: 'Strategy', icon: 'target' },
    { label: 'Creativity', icon: 'lightbulb' },
    { label: 'Technology', icon: 'monitor-play' },
  ];
  const statement = missionHtml(a.mission, ['impactful and innovative advertising campaigns', 'target audience'], focus.map((f) => f.label.toLowerCase()));
  const quoteMark = '<svg class="ab-mission__mark" viewBox="0 0 48 36" aria-hidden="true" focusable="false"><path d="M0 36V22C0 10 6 2.5 18.5 0l2 5C13.8 7 10.6 10.8 10 16h9v20H0zm27 0V22c0-12 6-19.5 18.5-22l2 5C40.8 7 37.6 10.8 37 16h9v20H27z"/></svg>';
  const mission = `<section class="section on-dark ab-mission" aria-labelledby="mission-title" data-live>
  <div class="container ab-mission__inner">
    <div class="section-head section-head--center" data-reveal>
      <p class="eyebrow">What Drives Us</p>
      <h2 class="ab-mission__title" id="mission-title">Our <span class="ab-mission__hl">Mission</span></h2>
    </div>
    <figure class="ab-mission__statement" data-reveal>
      ${quoteMark}
      <blockquote><p>${statement}</p></blockquote>
    </figure>
    <ul class="ab-focus" aria-label="Our expertise" data-reveal>
      ${focus.map((f, k) => `<li class="ab-focus__item" style="--k:${k}"><span class="ab-focus__icon">${icon(f.icon)}</span><span class="ab-focus__label">${esc(f.label)}</span></li>`).join('')}
    </ul>
  </div>
</section>`;

  /* ---------------------------------------------------------------- The pillars: three feed one */
  // The three pillars (site.js about.pillars) are cards whose dashed orange lines flow into one
  // "Successful Projects" card with the logo mark; the cards light up in turn (09-about.css).
  const pillarsTitle = splitTitle('The pillars of our <span class="ab-pillars__hl">successful projects</span>');
  const why = `<section class="section ab-pillars" aria-labelledby="why-about-title" data-live>
  <div class="container ab-pillars__grid">
    <div data-reveal="left">
      <p class="eyebrow">Why Brand Image</p>
      <h2 class="section-title" id="why-about-title"${pillarsTitle.attrs}>${pillarsTitle.html}</h2>
      <p class="lead" style="margin-top:18px">${esc(a.paragraphs[4])}</p>
    </div>
    <div class="ab-flow" data-reveal="right">
      <ol class="ab-flow__list" aria-label="Our pillars">
        ${a.pillars.map((p, k) => `<li class="ab-flow__item" style="--k:${k}">
          <span class="ab-flow__icon">${icon(p.icon)}</span>
          <span class="ab-flow__text"><span class="ab-flow__title">${esc(p.title)}</span></span>
        </li>`).join('')}
      </ol>
      <svg class="ab-flow__lines" viewBox="0 0 80 272" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 40C40 40 40 136 80 136"/><path d="M0 136H80"/><path d="M0 232C40 232 40 136 80 136"/>
        <path class="ab-flow__run" d="M0 40C40 40 40 136 80 136"/><path class="ab-flow__run" d="M0 136H80"/><path class="ab-flow__run" d="M0 232C40 232 40 136 80 136"/>
      </svg>
      <div class="ab-flow__result">
        <span class="ab-flow__mark"><img src="${MARK}" width="400" height="400" alt="" loading="lazy" decoding="async"></span>
        <p class="ab-flow__label">Successful Projects</p>
      </div>
    </div>
  </div>
</section>`;

  const main = [
    hero, intro, strengths, mission, why, S.consultBand(),
  ].join('\n\n');

  return [{
    path: 'about.html',
    def: {
      path: 'about.html',
      nav: 'about',
      bodyClass: 'page-about',
      title: 'About Us | Brand Image Media Pvt Ltd – Advertising Agency in Nashik',
      description: 'Brand Image Media Pvt Ltd is an experienced and dynamic advertising agency in Nashik with more than 12 years of experience in printing, branding, advertising and events.',
      jsonld: [seo.breadcrumbs(crumbs)],
    },
    main,
  }];
};
