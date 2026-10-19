const services = require('../content/services.json');
const { esc, icon, btn } = require('../components/helpers');

module.exports = function notFound() {
  const main = `<section class="not-found">
  <div class="container">
    <p class="not-found__code" aria-hidden="true">4<span>0</span>4</p>
    <h1>Page not found</h1>
    <p>The page you are looking for may have been moved or is no longer available. Here are some helpful links instead.</p>
    <div class="btn-row">
      ${btn({ href: 'index.html', label: 'Go to Home', variant: 'primary' })}
      ${btn({ href: 'service.html', label: 'Our Services', variant: 'secondary', iconName: null })}
      ${btn({ href: 'contact.html', label: 'Contact Us', variant: 'secondary', iconName: null })}
    </div>
    <ul class="chips" style="justify-content:center;margin-top:36px">
      ${services.map((s) => `<li><a class="chip" href="${s.slug}.html" style="text-decoration:none">${esc(s.name)}</a></li>`).join('')}
    </ul>
  </div>
</section>`;
  return [{
    path: '404.html',
    def: {
      path: '404.html',
      nav: null,
      bodyClass: 'page-404',
      title: 'Page Not Found | Brand Image Media Pvt Ltd',
      description: 'The page you are looking for could not be found.',
      noindex: true,
      base: '/',
    },
    main,
  }];
};
