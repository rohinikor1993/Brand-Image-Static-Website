const React = require('react');

const h = React.createElement;

// How long each banner stays on screen before the next one fades in over it (the fade, .5 s, is in
// 06-hero.css).
const DELAY = 2000;

// One slide's words: the service (in the site's eyebrow style), its headline and its line of text. All
// seven are in the page, stacked in one place, so the space they take never changes; only the one for
// the photo on screen is shown (and read out), the others are hidden.
function SlideCopy({ item, active }) {
  return h('div', {
    className: `slide-copy slide-copy--${item.key}${active ? ' is-active' : ''}`,
    'aria-hidden': active ? undefined : 'true',
    inert: active ? undefined : true,
  },
  h('p', { className: 'eyebrow slide-copy__tag' }, item.name),
  h('h2', { className: 'slide-copy__title', dangerouslySetInnerHTML: { __html: item.title } }),
  h('p', { className: 'slide-copy__text' }, item.text));
}

function PlayPauseIcon({ playing }) {
  return h('svg', { viewBox: '0 0 24 24', width: 18, height: 18, fill: 'currentColor', 'aria-hidden': 'true' },
    playing
      ? [h('rect', { key: 'a', x: 6, y: 5, width: 4, height: 14, rx: 1 }), h('rect', { key: 'b', x: 14, y: 5, width: 4, height: 14, rx: 1 })]
      : h('path', { d: 'M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z' }));
}

// The home page slider: the seven services one after another, without end. Every 2 seconds the next
// slide (its photo and its words) fades in over the current one. The first photo is in the page's
// HTML; once the page is running, each next photo is loaded while the one before it is on screen, and
// the slider waits for a photo that has not loaded yet, so it never shows an empty frame (a photo that
// fails to load is skipped). The round never stops by itself; it pauses only when the visitor presses
// Pause, and with "reduce motion" it waits for Play.
function HeroSlider({ slides }) {
  const count = slides.length;
  const [active, setActive] = React.useState(0);
  const [previous, setPrevious] = React.useState(null);
  const [started, setStarted] = React.useState(false);
  const [loaded, setLoaded] = React.useState(() => new Set([0]));
  const [failed, setFailed] = React.useState(() => new Set());
  const [playing, setPlaying] = React.useState(true);
  const [due, setDue] = React.useState(false);
  const slide = slides[active];
  const running = started && playing && count > 1;

  React.useEffect(() => {
    setStarted(true);
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(false);
  }, []);

  // the next banner in order, skipping any that failed to load
  function nextAfter(index) {
    for (let step = 1; step < count; step += 1) {
      const next = (index + step) % count;
      if (!failed.has(next)) return next;
    }
    return index;
  }
  const next = nextAfter(active);

  // 2 seconds after a banner appears, it is time for the next one ...
  React.useEffect(() => {
    if (!running || due) return undefined;
    const timer = window.setTimeout(() => setDue(true), DELAY);
    return () => window.clearTimeout(timer);
  }, [running, due, active]);

  // ... which comes in as soon as it has loaded
  React.useEffect(() => {
    if (!due || !running || next === active || !loaded.has(next)) return;
    setPrevious(active);
    setActive(next);
    setDue(false);
  }, [due, running, next, active, loaded]);

  function mark(setter, index) {
    setter((current) => (current.has(index) ? current : new Set(current).add(index)));
  }

  return h('section', {
    className: 'hero artwork-slider on-dark',
    'aria-roledescription': 'carousel',
    'aria-label': 'Our services',
  },
  h('h1', { className: 'hero__kicker sr-only' }, 'Brand Image Media Pvt Ltd — Printing, Branding & Advertising Agency in Nashik'),
  h('div', { className: 'hero__slides' },
    h('div', {
      className: 'hero-slider-frame',
      role: 'group',
      'aria-roledescription': 'slide',
      'aria-label': `${active + 1} of ${count}: ${slide.name}`,
    },
    // the photos (decorative: the slide's words say what it shows) and Pause / Play
    h('div', { className: 'hero-slide__media' },
      h('div', { className: 'hero-slide__stage', style: { '--stage-ratio': `${slides[0].width} / ${slides[0].height}` } }, slides.map((item, index) => {
        // the first photo is always there; the others join once the page is running, each while the
        // photo before it is on screen
        if (index > 0 && !(started && (index <= active + 1 || index === next || loaded.has(index)))) return null;
        const state = index === active ? ' is-active' : index === previous ? ' is-previous' : '';
        return h('img', {
          key: item.src,
          className: `hero-slide__artwork${state}`,
          src: item.src,
          srcSet: item.srcset,
          sizes: item.sizes,
          width: item.width,
          height: item.height,
          alt: '',
          fetchPriority: index === 0 ? 'high' : undefined,
          decoding: 'async',
          onLoad: () => mark(setLoaded, index),
          onError: () => mark(setFailed, index),
        });
      })),
      count > 1 ? h('button', {
        className: 'hero__pause',
        type: 'button',
        'aria-label': playing ? 'Pause the slides' : 'Play the slides',
        onClick: () => { setPlaying((value) => !value); setDue(false); },
      }, h(PlayPauseIcon, { playing })) : null),
    // the words of every slide, stacked; the one for the photo on screen is shown
    h('div', { className: 'slide-copy-panel' },
      h('div', { className: 'container slide-copy-stack' },
        slides.map((item, index) => h(SlideCopy, { key: item.key, item, active: index === active }))))),
  ),
  );
}

module.exports = HeroSlider;
