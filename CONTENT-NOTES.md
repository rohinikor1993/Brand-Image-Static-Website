# Content notes — please review

All copy on the new website comes from the existing Brand Image website. This file lists what needs a quick
confirmation from the Brand Image team, what was missing from the backup, and every small edit that was made.

## 1. Please confirm

| # | Item | What the new site does | Where to change |
|---|---|---|---|
| 1 | **Nagpur office** (old footer: *326/70, Mahesh Colony, Chandan Nagar, Nagpur, Maharashtra 440009*) | Not shown — the brief lists only the Nashik office. | `src/config.js` → `secondaryOffice.show: true` |
| 2 | **Business hours** | Not shown. The old contact page's "9:30 AM to 8 PM (Mon – Sat)" was in a hidden tab and identical to the website template's demo text, so it may not be real. | `src/config.js` → `businessHours` |
| 3 | **Vision statement** | Not shown — none exists in the current content. The Mission is shown. | `src/pages/about.js` (marked with a comment) |
| 4 | **"12+ Years Experience"** | From the 2023 copy ("More than 12 years…"). Shown with a count-up animation. | `src/content/site.js` → `about.experience` |
| 5 | **Awards** | The existing sentences ("recognized with prestigious awards", "award-winning agency") are kept word for word but not highlighted anywhere else. | `src/content/site.js` |
| 6 | **"We are here to answer your questions 24/7"** | Shown above "Need a Consultation?" in the band below "How We Work" on the Home and Services pages and at the end of the About page. | `src/components/sections.js` → `consultBand` |
| 7 | **Outdoor Media (Brand Adda) link** | `https://www.brand-image.co.in/outdoor` (from the current menu), opens in a new tab. Not shown anywhere on the site at the moment (removed from the menu, the footer, the About page and the Outdoor Advertising page at the client's request); the address stays in `src/config.js`. | `src/config.js` → `outdoorMedia.url` |
| 8 | **Contact form delivery** | Emailed directly through the company's SMTP account by `site/send-enquiry.php`; the SMTP password and the receiving address(es) must be filled in `.env` on the hosting (see `.env.example`). | `.env` (one folder above `public_html`) |
| 9 | **Testimonial photo for Vaibhav Patil** | Not needed for now: the reviews section has been removed from every page at the client's request (the reviews are kept in the content file). | `src/content/site.js` → `testimonials` |
| 10 | **Footer credit** | The old "Design by SpanDigit Social" line was removed (the design has changed). | `src/config.js` → `footerCredit` |
| 11 | **Social media** | Facebook and WhatsApp only (the old Instagram/YouTube icons had no links). | `src/config.js` → `social` |
| 12 | **Blog date** of "Digital Wall Painting: Redefining Art and Interior Design" | Shows 31 July 2022 as on the old site (looks like a template default date). | `src/content/blog.json` |
| 13 | **Blog authors** | "By Yogesh" shown where given; "admin" is not displayed. | `src/content/blog.json` |

## 2. Missing from the backup

These files returned "404 Not Found" on the live server when the backup was taken, so they are not in the project:

* **Gallery photos** — `assets/img/gall/*.webp` (37 files), `gall/shopb.jpg`, `gall/prom1.jpg`, `assets/img/Workshop/*.webp` (6).
  The new Gallery uses the 41 project photos that were already on the service pages, grouped by the old gallery
  categories. The "Workshop" category is hidden until its photos are available.
* **Blog cover photos** — `assets/img/blog/*`. Each article uses a relevant Brand Image project photo instead.
* **Favicons** (only 16 px and 32 px existed) — regenerated from the logo mark, plus Apple/Android icons and a social-share image.
  Since the brand identity guidelines (`Colour palate/`), the logo, icons and share image use the guidelines logo
  ("Advertising | Branding | Activation"), cut out of the guidelines picture; see README → Design system.

Four site photos had a GPS/location stamp printed across the bottom; the stamp area is cropped out in the web versions.

## 3. Discontinued service removed

The discontinued service is removed everywhere: its page, menu, footer and sidebar links, home/services cards,
the hero slide and its images, metadata and data files. Where other pages mentioned it inside a sentence, only that
word was taken out:

* **Printing → Eco Solvent Vinyl Printing:** "…ideal for vehicle wraps, window graphics, and more."
* **Shop Branding:** the heading "Interior Branding and …" is now "Interior Branding"; its paragraph lists "wall graphics, floor decals, and more".
* **Article "The Advantages of Flex Printing":** "…ideal for outdoor advertising campaigns."; application heading "1. Outdoor Advertising";
  "Flex prints are commonly used for outdoor advertising, including billboards…"; "…through wall graphics and fleet graphics."

## 4. Small corrections

* Spelling in service names and titles: Promotional (was Promotinal/Promotionl), Umbrella (Umbrlla), Advertising (Advertsing),
  Digital Wall Painting (Wallpainting/Wallpanting), Eco Solvent (Solvant), Brochure (Broucher), Clip-on Board (Clipon),
  Contact (Cantact), Media (Maedia), Query (Queary), Reviews (Review's), "Brand Image" in a testimonial (Iamge),
  "Pvt Ltd!" (Pvt ltd !). The page address `promotinal-material.html` is unchanged so existing links keep working.
* The button label "Get A Quote" is written "Get a Quote" everywhere, so all buttons use the same capitalisation.
* Event & Promotion page: the "Memorable Experiences" block appeared twice — shown once.
* Hoarding article: the repeated "4. Location Relevance" heading now reads "5. Call to Action" (its paragraph was that point);
  "we explored…" capitalised.
* Flex Printing article: the heading text that was accidentally repeated inside the first paragraph was removed.
* OOH article: restored the missing first word in "With great advertising power comes great responsibility."
* Transit Media card: the old card repeated Shop Branding's text; it now uses Transit Media's own intro sentence.
* Article headings were re-levelled (H1 → H2 → H3) for a correct outline; the wording is unchanged.
* The About page heading "Inspiring Tech Needs for Business" (left over from the website template) is not used.
* Service pages: the links inside the overview and closing text (e.g. "advertising agency", "Brand Image",
  "Media Advertising", "outdoor advertising agency", which all pointed to the home page) were removed at the client's
  request; the words are unchanged and now plain text (`src/content/services.json`).

## 5. New wording (UI only, no factual claims)

* Hero slide headings: "Print That Makes Your Brand Visible", "Make Your Brand Impossible to Miss", "Turn Walls Into Powerful Brand Media"
  (from the brief); "Elevate Your Shop's Branding", "Reach Your Audience on the Move", "Create Memorable Brand Experiences",
  "Make a Lasting Impression in the Marketplace" (adapted from phrases on the existing service pages).
* Section labels, buttons and short helper text such as "Our work across every medium", "From brief to delivery",
  "Talk to our team", "Get in Touch" (Contact page), "Need a custom campaign?", "Explore", "Enquire Now".
* Services menu (the drop-down under "Services"): the seven services are grouped under three headings, "Printing &
  Branding" (Printing, Shop Branding, Promotional Material), "Outdoor & Transit" (Outdoor Advertising, Transit Media,
  Digital Wall Painting) and "Events & Activation" (Event & Promotion, then "Know more"), beside the "All Services"
  card (with the line "Printing, branding, outdoor and transit media, digital wall painting, events and promotional
  material."). The groups and headings can be
  changed in `MEGA_GROUPS` in `src/components/layout.js`.
* About page: the "Advertising Capabilities" section (the service photo tiles and the "Thank you for choosing Brand Image
  Media Pvt Ltd…" note) was removed at the client's request; the thank-you sentence stays in `src/content/site.js`
  (`about.paragraphs`) but is not shown.
* Digital Wall Painting has no list of formats in the old content, so its points are the spaces named in its overview
  sentence ("…transform any space, be it a home, office, restaurant, or commercial establishment"): "Transform Any
  Space" with Home, Office, Restaurant and Commercial Establishment. They show on its page (the box under the overview
  and the header points), on its card on the Services page and in "All services and what they include". Replace them
  with real formats when the team has a list.
* About page: the "What Drives Us" label and visible "Our Mission" title of the mission section, the "Strategy",
  "Creativity" and "Technology" row under the mission (words taken from the mission),
  "Successful Projects" on the result card of the pillars diagram (from the heading). The About copy itself is unchanged.
* About page, Who We Are: the three feature cards "Creative Solutions – Ideas that work", "Expert Team – Driven by
  passion" and "Measurable Results – Growth focused" (from the About section redesign brief), and the badge label
  "Years of Experience" (was "Years Experience"). The welcome text is unchanged, only split into two paragraphs.
* Service pages: the labels "Get Started", "Talk to our team",
  "Our Work" ("Recent … projects", "Walls we have painted"), "Explore More", "All services" and the line under
  "Other services": "Take a look at everything else our team can do for your brand." Services overview:
  "What We Do". All service descriptions are unchanged.
* Page titles and meta descriptions: the existing ones are kept, except About, Contact and Gallery, whose old versions were
  just "Brand Image" or had typos.
