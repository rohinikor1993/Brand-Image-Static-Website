const site = require('../content/site');
const { IMAGES, esc, img } = require('../components/helpers');
const S = require('../components/sections');
const seo = require('../components/seo');

// The photo behind the header: the client's picture gallery-header.png (web copies made by
// `node src/tools/render_artwork.js gallery`)
const HERO_PHOTO = 'gallery-header';
const TILE_SIZES = '(min-width: 1850px) 290px, (min-width: 1280px) 19vw, (min-width: 1024px) 24vw, (min-width: 640px) 33vw, 50vw';

module.exports = function gallery() {
  const crumbs = [{ label: 'Home', href: 'index.html' }, { label: 'Gallery', href: 'gallery.html' }];
  // Only categories that have photos are shown
  const cats = site.galleryCategories.filter((c) => Object.values(IMAGES).some((im) => im.category === c.key));
  // Keep the category order of the services
  const keys = cats.flatMap((c) => Object.keys(IMAGES).filter((k) => IMAGES[k].category === c.key));
  const count = (key) => keys.filter((k) => IMAGES[k].category === key).length;

  const filters = [
    `<button class="filter-btn" type="button" data-filter="all" data-label="All projects" aria-pressed="true">All <span class="filter-btn__count">${keys.length}</span></button>`,
    ...cats.map((c) => `<button class="filter-btn" type="button" data-filter="${c.key}" data-label="${esc(c.label)}" aria-pressed="false">${esc(c.label)} <span class="filter-btn__count">${count(c.key)}</span></button>`),
  ].join('\n        ');

  // The photos: equal 4:3 tiles (five across on large screens); --n is each tile's turn in the light
  // that runs across them (13-gallery.css)
  const items = keys
    .map((k, i) => `<li data-cat-key="${IMAGES[k].category}" data-reveal style="--reveal-delay:${(i % 5) * 0.05}s;--n:${i}">${S.galleryItem(k, { group: 'gallery', sizes: TILE_SIZES, loading: i < 5 ? 'eager' : 'lazy' })}</li>`)
    .join('\n        ');

  const hero = S.pageHero({
    crumbs,
    eyebrow: 'Portfolio',
    title: 'Project <span class="gallery-hero__hl">Gallery</span>',
    meta: `<p class="gal-stats"><span><strong>${keys.length}</strong> project photos</span><span><strong>${cats.length}</strong> services</span></p>`,
    lead: 'A look at our work across printing, shop branding, outdoor and transit media, digital wall painting, events and promotional material.',
    variant: 'page-hero--gallery',
    // the photo behind the header (decorative)
    backdrop: img(HERO_PHOTO, { sizes: '100vw', target: 1672, priority: true, alt: '' }),
  });

  const body = `<section class="section section--page gallery-list" aria-labelledby="gallery-title" data-gallery data-live>
  <div class="container">
    <h2 class="sr-only" id="gallery-title">Project photos</h2>
    <div class="gallery-filters" role="group" aria-label="Filter photos by service">
        ${filters}
    </div>
    <p class="sr-only" data-gallery-status aria-live="polite"></p>
    <ul class="gallery-grid">
        ${items}
    </ul>
  </div>
</section>`;

  return [{
    path: 'gallery.html',
    def: {
      path: 'gallery.html',
      nav: 'gallery',
      bodyClass: 'page-gallery',
      title: 'Gallery | Brand Image Media Pvt Ltd - Advertising Agency In Nashik',
      description: 'Photos of our work in printing, shop branding, outdoor advertising, transit media, digital wall painting, events and promotional material by Brand Image Media Pvt Ltd.',
      jsonld: [seo.breadcrumbs(crumbs)],
    },
    main: [hero, body].join('\n\n'),
  }];
};
