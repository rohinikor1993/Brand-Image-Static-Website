const config = require('../config');
const posts = require('../content/blog.json');
const services = require('../content/services.json');
const { esc, icon, img, btn, srcFor, srcsetFor, excerpt, unlinkSelf } = require('../components/helpers');
const S = require('../components/sections');
const seo = require('../components/seo');

// Newest first
const sorted = posts.slice().sort((a, b) => (a.date < b.date ? 1 : -1));

/* Blog listing: the compact photo header (like Gallery, About and Contact) with "The Brand Image Blog" (a
   shine crosses "Blog") over a billboard in the brand blue and orange above a city (calm behind the text);
   the newest article as a compact featured card; the other articles four across, each with its topic, a
   soft light passing over their photos in turn (11-blog.css). No dates or reading times are shown. */
const FEATURED_SIZES = '(min-width: 900px) 420px, 100vw';
const CARD_SIZES = '(min-width: 1850px) 360px, (min-width: 1200px) 22vw, (min-width: 640px) 50vw, 100vw';

function listingPage() {
  const crumbs = [{ label: 'Home', href: 'index.html' }, { label: 'Blog', href: 'blog.html' }];
  const [featured, ...rest] = sorted;
  const firstP = featured.body.find((b) => b.p);
  const hero = S.pageHero({
    crumbs,
    eyebrow: 'Insights & Ideas',
    title: 'The Brand Image <span class="blog-hero__hl">Blog</span>',
    lead: 'Discover our blogs on outdoor advertising services in Nashik. Gain valuable insights into the world of impactful outdoor marketing and branding solutions.',
    variant: 'page-hero--blog',
    // the AI billboard photo behind the header (decorative)
    backdrop: img('hero-ai-outdoor', { sizes: '100vw', target: 1672, priority: true, alt: '' }),
  });
  const body = `<section class="section section--page blog-list" aria-labelledby="latest-title" data-live>
  <div class="container">
    <h2 class="sr-only" id="latest-title">Latest articles</h2>
    <article class="blog-feature" data-reveal>
      <div class="card__media">${img(featured.image, { sizes: FEATURED_SIZES, target: 800, priority: true })}</div>
      <div class="blog-feature__body">
        <p class="blog-feature__tags"><span class="blog-feature__label">Featured</span><span class="blog-topic">${esc(S.blogTopic(featured))}</span></p>
        <h3><a href="${featured.slug}.html">${esc(featured.title)}</a></h3>
        <p>${esc(excerpt(firstP.p, 200))}</p>
        ${btn({ href: `${featured.slug}.html`, label: 'Read Full Article', variant: 'primary' })}
      </div>
    </article>
    <div class="blog-grid blog-grid--4">
      ${rest.map((p, i) => S.blogCard(p, { delay: (i % 4) * 0.07, k: i, sizes: CARD_SIZES })).join('\n      ')}
    </div>
  </div>
</section>`;
  return {
    path: 'blog.html',
    def: {
      path: 'blog.html',
      nav: 'blog',
      bodyClass: 'page-blog',
      title: 'Blogs | Outdoor Advertising Agency - Services In Nashik',
      description: 'Discover our blogs on outdoor advertising services in Nashik. Gain valuable insights into the world of impactful outdoor marketing and branding solutions.',
      preload: [{ srcset: srcsetFor(featured.image), sizes: FEATURED_SIZES }],
      jsonld: [seo.breadcrumbs(crumbs)],
    },
    main: [hero, body].join('\n\n'),
  };
}

/* ---------------------------------------------------------------- an article (11-blog.css) */
/* The article's words (blog.json) unchanged, laid out like the rest of the site:
     - the first paragraph as the lead;
     - each h2 a numbered section (its anchor is in "In this article");
     - each h3 with the text under it a card; the cards of a section side by side, numbered when the
       heading is ("1. Cost-Effectiveness" → 01), one under another when their text is long;
     - lists as tick lists on a soft panel;
     - the last section (the conclusion) on a cream panel;
     - the FAQs as the site's accordion. */
const LONG_CARD = 420; // characters: cards with more text than this are shown one under another

const slugify = (text) => String(text).toLowerCase().replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const plainText = (html) => String(html).replace(/<[^>]+>/g, '');
const pad = (n) => String(n).padStart(2, '0');

function articleParts(post) {
  const lead = [];
  const sections = [];
  let faqs = null;
  let section = null;
  let card = null;
  post.body.forEach((b) => {
    if (b.faq) faqs = b.faq;
    else if (b.h2) {
      section = { title: b.h2, blocks: [] };
      sections.push(section);
      card = null;
    } else if (b.h3) {
      card = { title: b.h3, blocks: [] };
      (section ? section.blocks : lead).push({ card });
    } else {
      (card ? card.blocks : section ? section.blocks : lead).push(b);
    }
  });
  const used = new Set();
  sections.forEach((s, i) => {
    let id = slugify(s.title) || `section-${i + 1}`;
    while (used.has(id)) id += '-2';
    used.add(id);
    s.id = id;
    s.num = pad(i + 1);
  });
  return { lead, sections, faqs };
}

function blockHtml(b, file) {
  if (b.p) return `<p>${unlinkSelf(b.p, file)}</p>`;
  if (b.ul) return `<ul class="post-checks">${b.ul.map((li) => `<li>${icon('check-circle', { size: 20 })}<span>${li}</span></li>`).join('')}</ul>`;
  return '';
}

function cardsHtml(cards, file) {
  const long = cards.some((c) => c.blocks.reduce((n, b) => n + plainText(b.p || (b.ul || []).join(' ')).length, 0) > LONG_CARD);
  return `<div class="post-cards${long ? ' post-cards--stack' : ''}">${cards.map((c, i) => {
    const m = c.title.match(/^(\d+)\.\s*(.+)$/);
    const mark = m ? `<span class="post-card__mark" aria-hidden="true">${pad(m[1])}</span>` : '<span class="post-card__mark post-card__mark--dot" aria-hidden="true"></span>';
    return `<div class="post-card" data-reveal style="--reveal-delay:${(i % 2) * 0.06}s">${mark}<h3>${esc(m ? m[2] : c.title)}</h3>${c.blocks.map((b) => blockHtml(b, file)).join('')}</div>`;
  }).join('')}</div>`;
}

// a run of blocks: paragraphs and lists as they are, the cards next to each other grouped in one grid
function blocksHtml(blocks, file) {
  const out = [];
  let run = [];
  const flush = () => { if (run.length) out.push(cardsHtml(run, file)); run = []; };
  blocks.forEach((b) => {
    if (b.card) run.push(b.card);
    else { flush(); out.push(blockHtml(b, file)); }
  });
  flush();
  return out.join('');
}

function postPage(post) {
  const file = `${post.slug}.html`;
  const crumbs = [
    { label: 'Home', href: 'index.html' },
    { label: 'Blog', href: 'blog.html' },
    { label: post.title, href: file },
  ];
  const { lead, sections, faqs } = articleParts(post);
  const service = services.find((s) => s.key === post.service);
  const url = `${config.siteUrl}/${file}`;

  // the same compact photo header as the other pages, over the article's own photo: the topic as the
  // label, the title and byline
  const hero = S.pageHero({
    crumbs,
    eyebrow: S.blogTopic(post) || 'The Brand Image Blog',
    title: esc(post.title),
    meta: S.postMeta(post),
    variant: 'page-hero--article',
    backdrop: img(post.image, { sizes: '100vw', target: 1600, priority: true, alt: '' }),
  });
  const related = sorted.filter((p) => p.slug !== post.slug).slice(0, 3);

  const leadHtml = lead.length ? `<div class="post-lead" data-reveal>${blocksHtml(lead, file)}</div>` : '';
  // the article's photo in full under the lead (behind the header it is cropped and veiled)
  const figure = `<figure class="post-figure" data-reveal>${img(post.image, { sizes: '(min-width: 1024px) 780px, 100vw', target: 1200 })}</figure>`;
  const last = sections.length - 1;
  const sectionsHtml = sections.map((s, i) => `<section class="post-section${i === last ? ' post-section--closing' : ''}" id="${s.id}" aria-labelledby="${s.id}-title" data-reveal>
        <div class="post-section__head"><span class="post-section__num" aria-hidden="true">${s.num}</span><h2 id="${s.id}-title">${esc(s.title)}</h2></div>
        ${blocksHtml(s.blocks, file)}
      </section>`).join('\n      ');
  const faqHtml = faqs ? `<section class="post-section post-faq" id="faqs" aria-labelledby="faqs-title" data-reveal>
        <div class="post-section__head"><span class="post-section__num" aria-hidden="true">?</span><h2 id="faqs-title">Frequently asked questions</h2></div>
        <div class="faq">${faqs.map((f, i) => `<details${i === 0 ? ' open' : ''}><summary><span>${esc(f.q)}</span>${icon('chevron-down')}</summary><div class="faq__answer"><p>${esc(f.a)}</p></div></details>`).join('')}</div>
      </section>` : '';

  // beside the article on computers (under it on phones): "In this article" with the sections (the
  // one being read is marked, main.js) and sharing, which stays in view while the article is read;
  // at the end of the column, beside the conclusion, a card about the article's service
  const toc = [...sections.map((s) => ({ id: s.id, num: s.num, title: s.title })), ...(faqs ? [{ id: 'faqs', num: '?', title: 'FAQs' }] : [])];
  const aside = `<aside class="post-aside" aria-label="About this article">
      <div class="post-aside__track">
      <div class="post-toc">
        <nav aria-label="In this article">
          <p class="post-toc__title">In this article</p>
          <ol>${toc.map((t) => `<li><a href="#${t.id}"><span aria-hidden="true">${t.num}</span>${esc(t.title)}</a></li>`).join('')}</ol>
        </nav>
        <div class="post-share">
          <p><span class="post-share__say">Share</span><span class="post-share__ok" aria-hidden="true">${icon('check-circle', { size: 16 })}Link copied</span></p>
          <a href="https://wa.me/?text=${encodeURIComponent(`${post.title} ${url}`)}" target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp (opens in a new tab)">${icon('whatsapp', { size: 18 })}</a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook (opens in a new tab)">${icon('facebook', { size: 18 })}</a>
          <button type="button" data-copy-link="${esc(url)}" aria-label="Copy the link to this article">${icon('copy', { size: 18, cls: 'post-share__copy' })}${icon('check', { size: 18, cls: 'post-share__tick' })}<span class="post-share__done sr-only" aria-live="polite"></span></button>
        </div>
      </div>
      </div>
      ${service ? `<div class="post-cta on-dark">
        <p class="eyebrow">${esc(service.name)}</p>
        <p class="post-cta__title">Planning your next campaign?</p>
        <p class="post-cta__text">Talk to our team in Nashik about ${esc(service.name.toLowerCase())} for your brand.</p>
        ${btn({ href: `contact.html?service=${service.key}`, label: 'Get a Quote', variant: 'accent' })}
        <a class="post-cta__link" href="${service.slug}.html">Explore ${esc(service.name)} ${icon('arrow-right', { size: 16 })}</a>
      </div>` : ''}
    </aside>`;

  const article = `<section class="section post" aria-label="Article">
  <div class="read-progress" aria-hidden="true"><span></span></div>
  <div class="container post-layout">
    <article class="post-body">
      ${leadHtml}
      ${figure}
      ${sectionsHtml}
      ${faqHtml}
    </article>
    ${aside}
  </div>
</section>`;

  const relatedSection = `<section class="section section--soft" aria-labelledby="related-title">
  <div class="container">
    ${S.sectionHead({ eyebrow: 'Keep Reading', title: 'Related articles', id: 'related-title', action: btn({ href: 'blog.html', label: 'All Articles', variant: 'secondary' }) })}
    <div class="blog-grid blog-grid--3" style="margin-top:0">${related.map((p, i) => S.blogCard(p, { delay: i * 0.07 })).join('')}</div>
  </div>
</section>`;

  const jsonld = [seo.breadcrumbs(crumbs), seo.blogPosting(post)];
  if (faqs) jsonld.push(seo.faqPage(faqs));
  return {
    path: file,
    def: {
      path: file,
      nav: 'blog',
      navSub: true,
      bodyClass: 'page-post',
      title: post.seo.title,
      description: post.seo.description,
      ogType: 'article',
      ogTitle: post.title,
      ogImage: srcFor(post.image, 1200),
      preload: [{ srcset: srcsetFor(post.image), sizes: '100vw' }],
      jsonld,
    },
    main: [hero, article, relatedSection, S.consultBand()].join('\n\n'),
  };
}

module.exports = function blog() {
  return [listingPage(), ...sorted.map(postPage)];
};
