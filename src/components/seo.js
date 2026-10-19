/**
 * Structured data (JSON-LD) builders. Only facts present on the existing website are used.
 */
const config = require('../config');
const { fullSrc } = require('./helpers');

const ORG_ID = `${config.siteUrl}/#organization`;

function abs(path) {
  return `${config.siteUrl}/${path === 'index.html' ? '' : path}`;
}

function organization() {
  const a = config.address;
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': ORG_ID,
    name: config.company.name,
    alternateName: config.company.shortName,
    description: config.company.tagline,
    url: `${config.siteUrl}/`,
    logo: `${config.siteUrl}/assets/img/brand/brand-image-logo.png`,
    image: `${config.siteUrl}/assets/img/brand/og-brand-image.jpg`,
    telephone: config.phones.map((p) => p.tel),
    email: config.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: a.street,
      addressLocality: a.city,
      addressRegion: a.region,
      postalCode: a.postalCode,
      addressCountry: a.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: a.geo.lat, longitude: a.geo.lng },
    hasMap: config.map.link,
    sameAs: config.social.map((s) => s.url),
  };
}

function website() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${config.siteUrl}/#website`,
    url: `${config.siteUrl}/`,
    name: config.company.name,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-IN',
  };
}

function breadcrumbs(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.label,
      item: abs(it.href),
    })),
  };
}

function service(s) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.name,
    serviceType: s.name,
    description: s.short,
    url: abs(`${s.slug}.html`),
    image: `${config.siteUrl}/${fullSrc(s.hero.image)}`,
    provider: { '@id': ORG_ID },
    ...(s.features && s.features.length
      ? {
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: s.name,
            itemListElement: s.features.map((f) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: f } })),
          },
        }
      : {}),
  };
}

function blogPosting(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seo.description,
    datePublished: post.date,
    image: `${config.siteUrl}/${fullSrc(post.image)}`,
    url: abs(`${post.slug}.html`),
    mainEntityOfPage: abs(`${post.slug}.html`),
    author: post.author ? { '@type': 'Person', name: post.author } : { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-IN',
  };
}

function faqPage(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

module.exports = { organization, website, breadcrumbs, service, blogPosting, faqPage, abs };
