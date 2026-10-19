/**
 * Site-wide settings for the Brand Image Media Pvt Ltd website.
 * Change contact details, links or IDs here — every page is rebuilt from this file.
 */
const fs = require('fs');
const path = require('path');

/** A value from the environment or the project folder's .env file (public values only are used here). */
function envValue(key) {
  if (process.env[key]) return process.env[key];
  try {
    const line = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)
      .find((l) => l.trim().startsWith(`${key}=`));
    return line ? line.slice(line.indexOf('=') + 1).trim().replace(/^(["'])(.*)\1$/, '$2') : '';
  } catch (e) {
    return '';
  }
}

module.exports = {
  // Public address of the website (used for canonical URLs, sitemap and social previews)
  siteUrl: 'https://brand-image.co.in',

  company: {
    name: 'Brand Image Media Pvt Ltd',
    shortName: 'Brand Image',
    // The logo's tagline (brand identity guidelines)
    positioning: 'Printing | Branding | Advertising',
    tagline:
      'Brand Image Media Pvt Ltd is a highly skilled and dynamic advertising agency that specializes in printing, branding and advertising. Best Advertising Agency in Nashik.',
    footerDesc:
      'Brand Image Media Pvt. Ltd. is an experienced advertising and branding company helping brands reach their target audiences through <strong>innovative, customized and effective solutions</strong>.',
    // Existing footer copyright year is updated automatically to the current year.
  },

  phones: [
    { display: '+91 7770009506', tel: '+917770009506' },
    { display: '+91 7770018173', tel: '+917770018173' },
  ],

  email: 'sales@brand-image.co.in',

  // WhatsApp number in international format without "+" (existing site: 7770009506)
  whatsapp: {
    number: '917770009506',
    message: 'Hello Brand Image Media Pvt Ltd',
  },

  address: {
    lines: ['Office No-4, 1st Floor,', 'Sadashiv Motkari Sankul,', 'Sadashiv Nagar,', 'Opp. Sagar Sweet,', 'Nashik - 422009'],
    street: 'Office No-4, 1st Floor, Sadashiv Motkari Sankul, Sadashiv Nagar, Opp. Sagar Sweet',
    city: 'Nashik',
    region: 'Maharashtra',
    postalCode: '422009',
    country: 'IN',
    // From the Google Maps embed used on the existing website
    geo: { lat: 19.982486086574248, lng: 73.77327481491548 },
  },

  // Additional office found in the old website footer. It is not shown because the
  // current brief lists only the Nashik office. Set `show: true` to display it again.
  secondaryOffice: {
    show: false,
    label: 'Office Address 2',
    lines: ['326/70, Mahesh Colony,', 'Chandan Nagar, Nagpur,', 'Maharashtra 440009'],
  },

  // Optional business hours, e.g. 'Mon – Sat, 9:30 AM – 8:00 PM'. Empty = not shown.
  businessHours: '',

  map: {
    embed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3749.6197829232437!2d73.77327481491548!3d19.982486086574248!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bddeb2094f5d9ff%3A0x57bf9c97dbf22492!2sBrand%20Image!5e0!3m2!1sen!2sin!4v1680151600928!5m2!1sen!2sin',
    link: 'https://www.google.com/maps?cid=6322944577895539858',
  },

  // Only platforms that exist on the current website
  social: [{ name: 'Facebook', url: 'https://www.facebook.com/Brandimagensk/', icon: 'facebook' }],

  // OUTDOOR MEDIA navigation item — opens the Brand Adda website in a new tab
  outdoorMedia: {
    label: 'Outdoor Media',
    product: 'Brand Adda',
    url: 'https://www.brand-image.co.in/outdoor',
  },

  // Google Analytics 4 and Search Console verification from the existing website
  analyticsId: 'G-XZ4GX5JT5S',
  googleSiteVerification: 'OnWz26AAdryEEwY2yOXZUfoLNBbVcM3likBWlUKklhg',

  // Contact form: where the enquiry is sent. 'send-enquiry.php' (site/send-enquiry.php) emails it
  // through the SMTP account set in .env (see .env.example) and the page shows "submitted".
  // Leave empty to open the visitor's email app with the enquiry instead (no server needed).
  contactFormEndpoint: 'send-enquiry.php',

  // Google reCAPTCHA v2 ("I'm not a robot" checkbox) on the contact form. Both keys go in .env:
  // RECAPTCHA_SITE_KEY (public, built into the page) and RECAPTCHA_SECRET (private, read only by
  // send-enquiry.php and the preview's mailer). Without them there is no captcha. Get them at
  // https://www.google.com/recaptcha/admin (type: reCAPTCHA v2, "I'm not a robot" Checkbox).
  recaptchaSiteKey: envValue('RECAPTCHA_SITE_KEY'),

  // Optional footer credit, e.g. 'Design by Your Agency'. Empty = hidden.
  footerCredit: '',
};
