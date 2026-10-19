"""
Image manifest for the Brand Image website.

Every photo used on the site is listed here once, with:
  key      - short id used by the page templates (src/content/*.js)
  src      - original file inside the old website backup (brand-image.co.in/assets/img/...)
  out      - output folder + descriptive file name (without width/extension)
  alt      - alternative text (describes what is visible in the photo)
  focal    - CSS object-position used when the photo is cropped (x% y%)
  crop     - optional (left, top, right, bottom) fractions applied before resizing,
             used to trim the GPS/location stamp printed on some site photos
  category - gallery category (None = not shown in the gallery)

Run `python src/tools/optimize_images.py <path-to-old-backup>/assets/img` after
adding or replacing photos. It writes responsive WebP files into site/assets/img
and refreshes src/content/images.json, which the page builder reads.
"""

WIDTHS = [480, 800, 1200, 1600]

IMAGES = [
    # ---------------- Printing ----------------
    dict(key="print-machine", src="service/2.jpg", out="work/printing-large-format-printer",
         alt="Large-format printer producing flex prints", focal="50% 50%", category="printing"),
    dict(key="print-smart-posters", src="service/printt.jpg", out="work/printing-smart-superstore-posters",
         alt="Large printed posters on the wall of a SMART superstore", focal="50% 40%", category="printing"),
    dict(key="print-offer-display", src="service/print1.jpg", out="work/printing-in-store-offer-display",
         alt="Printed 'Buy 1 Get 1 Free' promotional display inside a supermarket", focal="50% 30%", category="printing"),
    dict(key="print-store-posters", src="service/print2.jpg", out="work/printing-retail-wall-posters",
         alt="Printed promotional posters along the walls of a retail store", focal="50% 45%", category="printing"),
    dict(key="print-instore-branding", src="service/ppt.jpg", out="work/printing-in-store-price-branding",
         alt="Printed in-store price promotion graphics at a SMART superstore", focal="40% 40%", category="printing"),
    dict(key="print-mahindra-backdrop", src="gallery/1..jpg", out="work/printing-mahindra-backdrop-flex",
         alt="Mahindra backdrop flex coming off a large-format printer", focal="50% 50%", category="printing"),

    # ---------------- Shop Branding ----------------
    dict(key="shop-arch-vivo", src="service/inshop.jpg", out="work/shop-branding-vivo-arch-gate",
         alt="vivo branded arch gate at a store entrance inside a mall", focal="50% 35%", category="shop-branding"),
    dict(key="shop-hero-showroom", src="service/bcc.jpg", out="work/shop-branding-hero-showroom",
         alt="Hero two-wheeler showroom entrance with branded displays", focal="50% 40%", category="shop-branding"),
    dict(key="shop-counter-venus", src="service/count.jpg", out="work/shop-branding-venus-counter",
         alt="Venus branded promotional counter", focal="50% 60%", category="shop-branding"),
    dict(key="shop-anchor-board", src="service/back.jpg", out="work/shop-branding-anchor-panasonic-board",
         alt="Anchor by Panasonic shop board above an electrical store", focal="50% 30%", category="shop-branding"),
    dict(key="shop-bosch-board", src="service/shop1.jpg", out="work/shop-branding-bosch-store-board",
         alt="Bosch shop board above an appliance store", focal="50% 40%", category="shop-branding"),
    dict(key="shop-medical-board", src="service/bord.jpg", out="work/shop-branding-medical-store-board",
         alt="Shop board above a medical and general store in Nashik", focal="50% 45%", category="shop-branding",
         crop=(0, 0, 1, 0.66)),

    # ---------------- Outdoor Advertising ----------------
    dict(key="outdoor-bus-stand", src="service/out1.jpg", out="work/outdoor-bus-stand-display-boards",
         alt="Row of advertising display boards along a city bus stand", focal="50% 45%", category="outdoor"),
    dict(key="outdoor-mall-backlit", src="service/1.jpg", out="work/outdoor-mall-backlit-displays",
         alt="Illuminated vivo displays at a mall entrance at night", focal="50% 40%", category="outdoor"),
    dict(key="outdoor-wall-wrap", src="D:/Rohini/Brand Image/Brand IMage static website/Changes/Digital Wall Painting/1..jpg", out="work/outdoor-wall-wrap",
         alt="Painted tractor advertisement on the wall of a village building", focal="70% 50%", crop=(0, 0, 1, 0.665), category="outdoor"),
    dict(key="outdoor-bus-stand-boards", src="service/buss.jpg", out="work/outdoor-bus-stand-hanging-boards",
         alt="vivo display boards hanging above a busy bus stand platform", focal="50% 35%", category="outdoor"),
    dict(key="outdoor-highway-hoarding", src="service/walll222.jpg", out="work/outdoor-highway-hoarding",
         alt="Hero Destini 125 hoarding beside a highway", focal="50% 60%", category="outdoor",
         crop=(0, 0, 1, 0.66)),

    # ---------------- Transit Media ----------------
    dict(key="transit-mahindra-van", src="service/media1.jpg", out="work/transit-mahindra-mobile-van",
         alt="Mahindra EPC mobile van with advertising panels", focal="50% 50%", category="transit"),
    dict(key="transit-led-van", src="service/media.jpg", out="work/transit-led-screen-van",
         alt="LED screen van used for mobile advertising", focal="50% 45%", category="transit"),
    dict(key="transit-celekt-vans", src="service/transfer.jpg", out="work/transit-celekt-branded-vans",
         alt="Convoy of Celekt branded mobile vans", focal="50% 50%", category="transit"),
    dict(key="transit-tricycles-lineup", src="service/media2.jpg", out="work/transit-branded-tricycles-lineup",
         alt="Branded tricycles lined up for a Celekt campaign", focal="50% 45%", category="transit"),
    dict(key="transit-auto", src="service/auto.jpg", out="work/transit-auto-rickshaw-branding",
         alt="Auto rickshaw with a bank advertising panel on the back", focal="50% 50%", category="transit"),
    dict(key="transit-tricycles-road", src="service/tri.jpg", out="work/transit-tricycles-on-road",
         alt="Branded advertising tricycles moving along a city road", focal="50% 50%", category="transit"),

    # ---------------- Digital Wall Painting ----------------
    dict(key="wall-ponds", src="service/10.jpg", out="work/wall-painting-ponds",
         alt="Painted wall advertisement for Pond's", focal="50% 45%", category="wall-painting"),
    dict(key="wall-tractor", src="service/6.jpg", out="work/wall-painting-tractor-dealer",
         alt="Painted wall advertisement for a tractor dealer in Saykheda, Maharashtra", focal="55% 45%", category="wall-painting",
         crop=(0, 0, 1, 0.66)),
    dict(key="wall-health-1", src="service/r1.jpg", out="work/wall-painting-health-awareness",
         alt="Public health awareness message painted on a wall", focal="50% 40%", category="wall-painting"),
    dict(key="wall-health-2", src="service/r2.jpg", out="work/wall-painting-public-health-department",
         alt="Maharashtra public health department message painted on a wall", focal="50% 40%", category="wall-painting"),
    dict(key="wall-honda", src="service/wallp.jpg", out="work/wall-painting-honda-shine",
         alt="Honda Shine advertisement painted on a wall", focal="50% 50%", category="wall-painting"),
    dict(key="wall-volini", src="service/11.jpg", out="work/wall-painting-volini",
         alt="Volini advertisement on a roadside wall in Ghatnandur, Maharashtra", focal="60% 50%", category="wall-painting",
         crop=(0, 0, 1, 0.66)),

    # ---------------- Event & Promotion ----------------
    dict(key="event-stage", src="service/event2.jpg", out="work/event-stage-performance",
         alt="Dance performance on stage at a vivo V5 launch event", focal="50% 40%", category="events"),
    dict(key="event-bosch-stall", src="service/mall.jpg", out="work/event-bosch-exhibition-stall",
         alt="Bosch exhibition stall inside a shopping mall", focal="50% 50%", category="events"),
    dict(key="event-hall", src="service/car.jpg", out="work/event-corporate-hall",
         alt="Audience seated at a corporate event in a banquet hall", focal="50% 50%", category="events"),
    dict(key="event-launch-stage", src="service/ev.jpg", out="work/event-product-launch-stage",
         alt="Stage and LED screen set up for a smartphone launch event", focal="50% 55%", category="events"),
    dict(key="event-photo-booth", src="service/event1.jpg", out="work/event-celekt-photo-booth",
         alt="Celekt branded photo booth with a balloon arch at a store event", focal="45% 40%", category="events"),
    dict(key="event-gulf-team", src="service/carwa.jpg", out="work/event-gulf-promotion-team",
         alt="Promotion team standing beside a Gulf branded car", focal="50% 55%", category="events"),

    # ---------------- Promotional Material ----------------
    dict(key="promo-standees", src="service/pro1.jpg", out="work/promotional-roll-up-standees",
         alt="Roll-up standees for Hero two-wheelers", focal="50% 50%", category="promotional"),
    dict(key="promo-danglers", src="service/pro.jpg", out="work/promotional-vivo-diwali-danglers",
         alt="vivo Diwali dangler designs", focal="50% 50%", category="promotional"),
    dict(key="promo-umbrella", src="service/pro3.jpg", out="work/promotional-mahindra-umbrella",
         alt="Mahindra branded umbrella", focal="55% 50%", category="promotional"),
    dict(key="promo-vivo-bag", src="service/pro44.jpg", out="work/promotional-vivo-carry-bag",
         alt="vivo branded paper carry bag", focal="50% 55%", category="promotional"),
    dict(key="promo-cutout", src="service/small.jpg", out="work/promotional-vivo-cutout-standee",
         alt="vivo cutout standee for a smartphone campaign", focal="45% 40%", category="promotional"),
    dict(key="promo-ghadi-bag", src="service/paper.jpg", out="work/promotional-ghadi-paper-bag",
         alt="Ghadi branded paper bag", focal="50% 50%", category="promotional"),

    # ---------------- Office ----------------
    dict(key="office-reception", src="about/A.webp", out="about/brand-image-office-reception",
         alt="Brand Image office reception", focal="50% 50%", category=None),
    dict(key="office-wall", src="about/B.webp", out="about/brand-image-office-interior",
         alt="Brand Image office interior", focal="50% 50%", category=None),
    dict(key="office-printer", src="about/H.webp", out="about/brand-image-office-printer",
         alt="Large-format printer at the Brand Image office", focal="50% 50%", category=None),

    # ---------------- People (testimonials) ----------------
    dict(key="person-sagar", src="testimonial/sagar.jpg", out="people/sagar-thakare",
         alt="Sagar Thakare", focal="50% 35%", category=None, widths=[160, 320]),
    dict(key="person-sureka", src="testimonial/sureka.jpg", out="people/sureka-sarode",
         alt="Sureka Sarode", focal="50% 22%", category=None, widths=[160, 320], crop_square=True),
]
