const config = require('../config');
const { esc, icon, img } = require('../components/helpers');
const S = require('../components/sections');
const seo = require('../components/seo');
const { primaryPhone, waLink, phoneText } = require('../components/layout');

module.exports = function contact() {
  const crumbs = [{ label: 'Home', href: 'index.html' }, { label: 'Contact Us', href: 'contact.html' }];
  // The compact photo header (like the Gallery's and About's): the Brand Image office building
  // (contact-building.png, see render_artwork.js) on the right, behind the title and the company tagline (as
  // on About; decorative; no buttons: the cards below and the bar on phones offer calling and WhatsApp)
  const hero = S.pageHero({
    crumbs,
    title: 'Contact <span class="hl">Us</span>',
    lead: esc(config.company.tagline),
    variant: 'page-hero--contact',
    backdrop: img('contact-office', { sizes: '(min-width: 900px) 420px, 100vw', target: 452, priority: true, alt: '' }),
  });

  /* One simple section (12-contact.css): the heading; on the left the ways to reach us as a plain list,
     on the right the enquiry form in a white card; the map across the width below. On phones: the list,
     the form, then the map. Every detail comes from src/config.js. */
  const a = config.address;
  const addressLines = [];
  for (let i = 0; i < a.lines.length; i += 2) addressLines.push(a.lines.slice(i, i + 2).map(esc).join(' '));
  const ways = [
    { icon: 'phone', label: 'Call Us', html: `<p>${config.phones.map((p) => `<a href="tel:${p.tel}">${phoneText(p)}</a>`).join('<br>')}</p>` },
    { icon: 'whatsapp', label: 'WhatsApp', html: `<p><a href="${esc(waLink)}" target="_blank" rel="noopener noreferrer">${phoneText(primaryPhone)}<span class="sr-only"> (opens WhatsApp in a new tab)</span></a></p>` },
    { icon: 'mail', label: 'Email Us', html: `<p><a href="mailto:${config.email}">${esc(config.email)}</a></p>` },
    {
      icon: 'map-pin',
      label: 'Visit Our Office',
      html: `<address>${[`${esc(config.company.name)},`, ...addressLines].join('<br>')}</address>
          <a class="contact-list__directions" href="${esc(config.map.link)}" target="_blank" rel="noopener noreferrer">Get Directions ${icon('arrow-up-right')}<span class="sr-only"> (opens Google Maps in a new tab)</span></a>`,
    },
  ];
  if (config.businessHours) ways.push({ icon: 'clock', label: 'Business Hours', html: `<p>${esc(config.businessHours)}</p>` });

  const body = `<section class="section contact-simple" aria-labelledby="contact-title" data-live>
  <div class="container">
    ${S.sectionHead({ eyebrow: 'Get in Touch', title: 'Talk to our <span class="live-hl">team</span>', lead: 'We’re Ready To Help You. Call, email or visit our office in Nashik.', id: 'contact-title' })}
    <div class="contact-simple__grid">
      <ul class="contact-list" data-reveal>
        ${ways.map((w) => `<li class="contact-list__item">
          <span class="contact-list__icon" aria-hidden="true">${icon(w.icon)}</span>
          <div><h3>${esc(w.label)}</h3>${w.html}</div>
        </li>`).join('\n        ')}
      </ul>
      <div class="contact-simple__form" id="enquiry" data-reveal>
        <h3 class="contact-simple__form-title">Send us a message</h3>
        <p class="contact-simple__form-lead">Share a few details and our team will get back to you.</p>
        ${S.contactForm()}
      </div>
    </div>
    ${S.mapFrame()}
  </div>
</section>`;

  return [{
    path: 'contact.html',
    def: {
      path: 'contact.html',
      nav: 'contact',
      bodyClass: 'page-contact',
      title: 'Contact Us | Brand Image Media Pvt Ltd - Advertising Agency in Nashik',
      description: `Contact Brand Image Media Pvt Ltd, Sadashiv Nagar, Nashik. Call ${config.phones.map((p) => p.display).join(' / ')} or email ${config.email} for printing, branding and advertising enquiries.`,
      jsonld: [seo.breadcrumbs(crumbs), seo.organization()],
    },
    main: [hero, body].join('\n\n'),
  }];
};
