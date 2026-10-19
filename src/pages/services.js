const services = require('../content/services.json');
const { esc, icon, img, btn, splitTitle } = require('../components/helpers');
const S = require('../components/sections');
const seo = require('../components/seo');

/* Services overview (styled in 10-services.css with the service pages): the compact photo header (like
   About), the seven services as cards (four across from 1280px, the "Need a custom campaign?"
   card as the eighth tile), "at a glance" lists and the way we work. Every service's points come from
   S.serviceFeatures(), the same list its own page shows. The cards show only the photo, the name, the
   short description and the links (each service's formats are on its own page). */

function svcCard(s, i) {
  return `<article class="svc-index-card" data-reveal style="--reveal-delay:${(i % 4) * 0.07}s">
      <div class="svc-index-card__media">
        ${img(s.hero.image, { sizes: '(min-width: 1850px) 360px, (min-width: 1280px) 23vw, (min-width: 1024px) 31vw, (min-width: 640px) 50vw, 100vw', target: 800 })}
      </div>
      <div class="svc-index-card__body">
        <span class="svc-icon" aria-hidden="true">${icon(s.icon)}</span>
        <h2 class="svc-index-card__title"><a class="stretched-link" href="${s.slug}.html">${esc(s.name)}</a></h2>
        <p>${esc(s.short)}</p>
        <div class="svc-index-card__foot">
          <span class="svc-link" aria-hidden="true">Explore ${icon('arrow-right', { size: 18 })}</span>
          ${btn({ href: `contact.html?service=${s.key}`, label: 'Enquire Now', variant: 'secondary', size: 'sm', iconName: null, attrs: { 'aria-label': `Enquire now about ${s.name}` } })}
        </div>
      </div>
    </article>`;
}

module.exports = function servicesPage() {
  const crumbs = [{ label: 'Home', href: 'index.html' }, { label: 'Services', href: 'service.html' }];
  // The compact photo header, like About, Gallery, Contact and Blog (S.pageHero with a backdrop,
  // 06-hero.css): the title and the intro over a real project photo, a vivo display we branded
  const hero = S.pageHero({
    crumbs,
    title: 'Our <span class="hl">Services</span>',
    lead: 'We help you to establish your Brand presence — with printing, shop branding, outdoor advertising, transit media, digital wall painting, events and promotional material.',
    variant: 'page-hero--services',
    backdrop: img('shop-arch-vivo', { sizes: '100vw', target: 1280, priority: true, alt: '' }),
  });

  const grid = `<section class="svc-section svc-section--cream" aria-label="All services">
  <div class="svc-container">
    <div class="svc-index-grid">
      ${services.map(svcCard).join('\n      ')}
      <div class="svc-index-cta">
        ${S.ctaCard({ title: 'Need a custom campaign?', text: 'Tell us about your brand, audience and budget — our team will put together the right mix of services for you.', delay: 0 })}
      </div>
    </div>
  </div>
</section>`;

  const glanceTitle = splitTitle('All services and what they include');
  const tree = `<section class="svc-section svc-glance" aria-labelledby="tree-title">
  <div class="svc-container">
    <div class="svc-head svc-head--center" data-reveal>
      <div>
        <p class="eyebrow">At a Glance</p>
        <h2 class="svc-title" id="tree-title"${glanceTitle.attrs}>${glanceTitle.html}</h2>
      </div>
    </div>
    <ul class="service-tree">
      ${services.map((s, i) => `<li data-reveal style="--reveal-delay:${(i % 3) * 0.06}s">
        <a class="service-tree__head" href="${s.slug}.html"><span class="svc-icon svc-icon--xs" aria-hidden="true">${icon(s.icon)}</span>${esc(s.name)}</a>
        ${(() => {
          const f = S.serviceFeatures(s);
          // a list that is not the service's features (Digital Wall Painting's spaces) keeps its title
          const label = f.title === 'Service Features' ? '' : `<p class="service-tree__label">${esc(f.title)}</p>`;
          return `${label}<ul>${f.list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
        })()}
      </li>`).join('')}
    </ul>
  </div>
</section>`;

  const main = [hero, grid, tree, S.journeySection(), S.consultBand()].join('\n\n');
  return [{
    path: 'service.html',
    def: {
      path: 'service.html',
      nav: 'services',
      bodyClass: 'page-services',
      title: 'Brand Image Services | Outdoor Advertising Service In Nashik',
      description: 'Discover top-notch outdoor advertising solutions in Nashik to enhance your brand image. Our services are designed to captivate audiences and leave a lasting impression.',
      jsonld: [seo.breadcrumbs(crumbs)],
    },
    main,
  }];
};
