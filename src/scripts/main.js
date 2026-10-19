/*!
 * Brand Image Media Pvt Ltd — site scripts
 * Vanilla JS, no dependencies. Every feature is progressive: the site stays
 * usable (content visible, links working) if this file fails to load.
 */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function on(el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts || false); }

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

  function trapFocus(container, event) {
    if (event.key !== 'Tab') return;
    var items = $$(FOCUSABLE, container).filter(function (el) {
      return el.offsetParent !== null || el === doc.activeElement;
    });
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && doc.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && doc.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ------------------------------------------------------------ Header */
  // The header always stays at the top of the window, scrolling up or down; once the page moves it
  // gets a soft shadow.
  function initHeader() {
    var header = $('.site-header');
    var toTop = $('.to-top');
    if (!header && !toTop) return;
    var ticking = false;
    function update() {
      var y = window.scrollY || window.pageYOffset;
      if (header) header.classList.toggle('is-scrolled', y > 8);
      if (toTop) toTop.classList.toggle('is-visible', y > 700);
      ticking = false;
    }
    on(window, 'scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    on(window, 'resize', function () { if (!ticking) { window.requestAnimationFrame(update); ticking = true; } });
    update();
    on(toTop, 'click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      var skip = $('#main');
      if (skip) skip.focus({ preventScroll: true });
    });
  }

  /* ------------------------------------------------------------ Nav indicator */
  // One orange line glides under the main navigation link that is pointed at or focused, and
  // goes back under the current page's link (or fades away if the page has none).
  function initNavIndicator() {
    var nav = $('.main-nav');
    var line = nav ? $('.main-nav__indicator', nav) : null;
    if (!line) return;
    var links = $$('.main-nav__link', nav);
    var current = links.filter(function (a) {
      return a.getAttribute('aria-current') === 'page' || a.parentNode.classList.contains('is-current');
    })[0] || null;
    function moveTo(link) {
      if (!link || !link.offsetWidth) { nav.style.setProperty('--ind-o', '0'); return; }
      var pad = parseFloat(window.getComputedStyle(link).paddingLeft) || 0;
      var right = parseFloat(window.getComputedStyle(link).paddingRight) || 0;
      var box = link.getBoundingClientRect();
      var navBox = nav.getBoundingClientRect();
      nav.style.setProperty('--ind-x', (box.left - navBox.left + pad) + 'px');
      nav.style.setProperty('--ind-w', Math.max(0, box.width - pad - Math.min(right, pad)) + 'px');
      nav.style.setProperty('--ind-o', '1');
    }
    nav.classList.add('has-indicator');
    // place it without a slide the first time
    line.style.transition = 'none';
    moveTo(current);
    window.requestAnimationFrame(function () { line.style.transition = ''; });
    links.forEach(function (a) {
      on(a, 'mouseenter', function () { moveTo(a); });
      on(a, 'focus', function () { moveTo(a); });
    });
    on($('.main-nav__list', nav), 'mouseleave', function () { moveTo(current); });
    on(nav, 'focusout', function (e) { if (!nav.contains(e.relatedTarget)) moveTo(current); });
    on(window, 'resize', function () { moveTo(current); });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { moveTo(current); });
  }

  /* ------------------------------------------------------------ Mega menu */
  function initMegaMenu() {
    $$('[data-mega]').forEach(function (item) {
      var toggle = $('.main-nav__toggle', item);
      var panel = $('.mega', item);
      if (!toggle || !panel) return;
      var closeTimer;
      var hoverOpenedAt = 0;

      function open() {
        clearTimeout(closeTimer);
        panel.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
      }
      function close() {
        panel.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
      on(toggle, 'click', function () {
        // A click right after the hover opened the menu should not close it again
        if (panel.classList.contains('is-open') && Date.now() - hoverOpenedAt > 600) close(); else open();
      });
      on(item, 'mouseenter', function () {
        if (!finePointer.matches) return;
        if (!panel.classList.contains('is-open')) hoverOpenedAt = Date.now();
        open();
      });
      on(item, 'mouseleave', function () {
        if (!finePointer.matches) return;
        closeTimer = setTimeout(close, 180);
      });
      on(item, 'keydown', function (e) {
        if (e.key === 'Escape' && panel.classList.contains('is-open')) {
          close();
          toggle.focus();
        }
      });
      on(item, 'focusout', function (e) {
        if (!item.contains(e.relatedTarget)) close();
      });
      on(doc, 'click', function (e) {
        if (!item.contains(e.target)) close();
      });
    });
  }

  /* ------------------------------------------------------------ Mobile nav */
  function initMobileNav() {
    var nav = $('#mobile-nav');
    var openBtn = $('.nav-toggle');
    if (!nav || !openBtn) return;
    var panel = $('.mobile-nav__panel', nav);
    var lastFocus = null;
    var mainParts = $$('body > header, body > main, body > footer, .mobile-cta');

    function setInert(state) {
      mainParts.forEach(function (el) {
        if (state) el.setAttribute('inert', ''); else el.removeAttribute('inert');
      });
    }
    function open() {
      lastFocus = doc.activeElement;
      nav.removeAttribute('inert');
      nav.classList.add('is-open');
      openBtn.setAttribute('aria-expanded', 'true');
      doc.body.classList.add('nav-open');
      setInert(true);
      window.setTimeout(function () {
        var first = $('.mobile-nav__close', nav);
        if (first) first.focus();
      }, 60);
    }
    function close() {
      nav.classList.remove('is-open');
      nav.setAttribute('inert', '');
      openBtn.setAttribute('aria-expanded', 'false');
      doc.body.classList.remove('nav-open');
      setInert(false);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    on(openBtn, 'click', open);
    $$('[data-close-nav]', nav).forEach(function (el) { on(el, 'click', close); });
    on(nav, 'keydown', function (e) {
      if (e.key === 'Escape') close();
      trapFocus(panel, e);
    });
    $$('.mobile-nav__acc', nav).forEach(function (btn) {
      on(btn, 'click', function () {
        var sub = doc.getElementById(btn.getAttribute('aria-controls'));
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        if (sub) sub.hidden = expanded;
      });
    });
    // Close the drawer when the viewport grows to desktop size
    var desktop = window.matchMedia('(min-width: 1024px)');
    var onChange = function (e) { if (e.matches && nav.classList.contains('is-open')) close(); };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
  }

  /* ------------------------------------------------------------ Deferred pictures */
  function hydrate(img) {
    if (!img || !img.dataset) return;
    if (img.dataset.srcset) { img.srcset = img.dataset.srcset; img.removeAttribute('data-srcset'); }
    if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
  }

  /* ------------------------------------------------------------ Reveal + counters */
  function initReveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;
    if (!('IntersectionObserver' in window) || reduceMotion.matches) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  function initCounters() {
    var items = $$('[data-count]');
    if (!items.length) return;
    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduceMotion.matches || !target) { el.textContent = target + suffix; return; }
      var start = null;
      var dur = 1400;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
      }
      el.textContent = '0' + suffix;
      window.requestAnimationFrame(step);
    }
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------ Looping highlights (About page) */
  // Blocks marked data-live run their looping highlights only while they are on screen (.is-live);
  // off screen the loops are paused (09-about.css), so nothing animates where nobody can see it.
  function initLive() {
    var items = $$('[data-live]');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-live'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { entry.target.classList.toggle('is-live', entry.isIntersecting); });
    }, { rootMargin: '120px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------ Service cards: photos in turn */
  // Each home page service card holds a few photos of that service. Every 2 seconds the next
  // card on screen fades to its next photo, one card after another, so the grid keeps changing
  // gently. A card changes at most every 6 seconds, never while the pointer is on it, and
  // nothing changes while the cards are off screen or the visitor prefers reduced motion.
  function initServiceCycle() {
    var cards = $$('.service-card[data-cycle]');
    if (!cards.length || reduceMotion.matches || !('IntersectionObserver' in window)) return;
    var TICK = 2000;
    var MIN_GAP = 6000;
    var START_AFTER = 1800;              // let the cards finish coming in first
    var state = cards.map(function (card) {
      return { card: card, photos: $$('.card__photo', card), index: 0, visible: false, hover: false, last: 0 };
    });
    var timer = null;
    var startAt = 0;
    var turn = -1;

    function ready(img) { return img.complete && img.naturalWidth > 1; }

    function tick() {
      var now = Date.now();
      if (now < startAt) return;
      for (var n = 1; n <= state.length; n++) {
        var k = (turn + n) % state.length;
        var st = state[k];
        if (!st.visible || st.hover || now - st.last < MIN_GAP) continue;
        var nextIndex = (st.index + 1) % st.photos.length;
        if (!ready(st.photos[nextIndex])) continue;
        st.photos[st.index].classList.remove('is-shown');
        st.photos[nextIndex].classList.add('is-shown');
        st.index = nextIndex;
        st.last = now;
        turn = k;
        return;
      }
    }

    function update() {
      var any = !doc.hidden && state.some(function (st) { return st.visible; });
      if (any && !timer) {
        startAt = Math.max(startAt, Date.now() + START_AFTER);
        timer = setInterval(tick, TICK);
      } else if (!any && timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    // Load the extra photos when the cards are about to come into view
    var near = new IntersectionObserver(function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      state.forEach(function (st) { st.photos.forEach(hydrate); });
      near.disconnect();
    }, { rootMargin: '300px 0px' });
    near.observe(cards[0].parentNode);

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        state[cards.indexOf(e.target)].visible = e.isIntersecting;
      });
      update();
    }, { threshold: 0.4 });

    state.forEach(function (st) {
      io.observe(st.card);
      on(st.card, 'mouseenter', function () { st.hover = true; });
      on(st.card, 'mouseleave', function () { st.hover = false; });
    });
    on(doc, 'visibilitychange', update);
  }

  /* ------------------------------------------------------------ Other services: the turning row */
  // The service pages' "Other services" (service-detail.js): the cards stand around the one in the middle
  // (data-pos 0; 1 and 2 to the right, -1 and -2 to the left, 3 and -3 out of sight; 10-services.css).
  // Every 2 seconds the next service comes to the middle, for as long as the row is on screen and the
  // page is in view (the pointer never stops it). Not with "reduce motion", nor while the keyboard is in
  // the row. The pills and the arrows bring a service to the middle and the 2 seconds start again; a
  // swipe does the same on phones. Clicking a card opens its page.
  function initServiceFlow() {
    $$('[data-flow]').forEach(function (flow) {
      var cards = $$('[data-flow-card]', flow);
      var pills = $$('[data-flow-go]', flow);
      var pillRow = $('.svc-flow__pills', flow);
      var stage = $('.svc-flow__stage', flow);
      var n = cards.length;
      if (n < 2) return;
      var DELAY = 2000;
      var half = Math.floor(n / 2);
      var current = 0;
      var visible = false;
      var keyboard = false;
      var timer = null;

      // Going forward the cards move left: places run -3..2 and a card coming round leaves out of sight
      // on the left (-3) and comes back in from the right (+3); going back the other way round. A card
      // still in sight first slides out (a jump of several places with a pill), then comes round.
      var later = null;

      function comeRound(moves, entry) {
        moves.forEach(function (m) { m.card.classList.add('is-jump'); m.card.setAttribute('data-pos', entry); });
        void stage.offsetWidth;
        moves.forEach(function (m) { m.card.classList.remove('is-jump'); m.card.setAttribute('data-pos', m.d); });
      }

      function place(index, dir) {
        clearTimeout(later);
        var exit = dir >= 0 ? -3 : 3;
        var moves = cards.map(function (card, i) {
          var d = ((i - index) % n + n) % n;
          if (dir >= 0 ? d >= half : d > half) d -= n;
          var old = parseInt(card.getAttribute('data-pos'), 10);
          return { card: card, d: Math.max(-3, Math.min(3, d)), old: old, wrap: dir >= 0 ? d > old : d < old };
        });
        var round = moves.filter(function (m) { return m.wrap && m.old === exit; });
        var outFirst = moves.filter(function (m) { return m.wrap && m.old !== exit; });
        moves.forEach(function (m) { if (!m.wrap) m.card.setAttribute('data-pos', m.d); });
        outFirst.forEach(function (m) { m.card.setAttribute('data-pos', exit); });
        if (round.length) comeRound(round, -exit);
        if (outFirst.length) later = setTimeout(function () { comeRound(outFirst, -exit); }, 520);
        moves.forEach(function (m, i) {
          var active = i === index;
          m.card.setAttribute('aria-hidden', active ? 'false' : 'true');
          var link = $('a', m.card);
          if (active) link.removeAttribute('tabindex'); else link.setAttribute('tabindex', '-1');
        });
        pills.forEach(function (pill, i) { pill.setAttribute('aria-pressed', i === index ? 'true' : 'false'); });
        // keep the chosen pill in sight when the pills scroll sideways (phones)
        var pill = pills[index];
        if (pill && pillRow.scrollWidth > pillRow.clientWidth + 1) {
          var left = pill.offsetLeft - (pillRow.clientWidth - pill.offsetWidth) / 2;
          if (pillRow.scrollTo) pillRow.scrollTo({ left: left, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
          else pillRow.scrollLeft = left;
        }
      }

      function schedule() {
        clearTimeout(timer);
        timer = null;
        if (visible && !keyboard && !doc.hidden && !reduceMotion.matches) {
          timer = setTimeout(function () { go(current + 1, 1); }, DELAY);
        }
      }

      function go(index, dir) {
        current = (index % n + n) % n;
        place(current, dir);
        schedule();
      }

      pills.forEach(function (pill, i) {
        on(pill, 'click', function () {
          if (i === current) { schedule(); return; }
          var ahead = (i - current + n) % n;
          go(i, ahead <= half ? 1 : -1);
        });
      });
      on($('[data-flow-prev]', flow), 'click', function () { go(current - 1, -1); });
      on($('[data-flow-next]', flow), 'click', function () { go(current + 1, 1); });

      var startX = null;
      var startY = 0;
      on(stage, 'touchstart', function (e) { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
      on(stage, 'touchend', function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        var dy = e.changedTouches[0].clientY - startY;
        startX = null;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) go(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      }, { passive: true });

      // Stand still while the keyboard is in the row (not after a click, which also focuses a button)
      on(flow, 'focusin', function (e) {
        var byKeyboard = true;
        try { byKeyboard = e.target.matches(':focus-visible'); } catch (err) { /* older browsers */ }
        keyboard = byKeyboard;
        schedule();
      });
      on(flow, 'focusout', function (e) {
        if (flow.contains(e.relatedTarget)) return;
        keyboard = false;
        schedule();
      });

      on(doc, 'visibilitychange', schedule);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
          schedule();
        }, { threshold: 0.35 }).observe(stage);
      } else {
        visible = true;
      }
      place(current, 1);
      schedule();
    });
  }

  /* ------------------------------------------------------------ Lightbox */
  var lightbox = null;

  function buildLightbox() {
    var dlg = $('#lightbox');
    if (!dlg) return null;
    var img = $('.lightbox__img', dlg);
    var caption = $('.lightbox__caption', dlg);
    var counter = $('.lightbox__counter', dlg);
    var fsBtn = $('[data-lb-fullscreen]', dlg);
    var state = { items: [], index: 0, opener: null };

    function render() {
      var item = state.items[state.index];
      if (!item) return;
      img.classList.add('is-loading');
      var pre = new Image();
      pre.onload = pre.onerror = function () {
        img.src = item.src;
        img.alt = item.alt;
        img.classList.remove('is-loading');
      };
      pre.src = item.src;
      caption.innerHTML = (item.cat ? '<b>' + item.cat + '</b>' : '') + escapeHtml(item.alt);
      counter.textContent = (state.index + 1) + ' / ' + state.items.length;
      var many = state.items.length > 1;
      $$('.lightbox__nav', dlg).forEach(function (b) { b.hidden = !many; });
      // Preload neighbours
      [state.index + 1, state.index - 1].forEach(function (n) {
        var it = state.items[(n + state.items.length) % state.items.length];
        if (it) { var p = new Image(); p.src = it.src; }
      });
    }

    function open(items, index, opener) {
      state.items = items;
      state.index = index;
      state.opener = opener || null;
      render();
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      doc.body.classList.add('nav-open');
      window.requestAnimationFrame(function () { dlg.classList.add('is-shown'); });
      var closeBtn = $('[data-lb-close]', dlg);
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      if (doc.fullscreenElement && doc.exitFullscreen) doc.exitFullscreen();
      dlg.classList.remove('is-shown');
      doc.body.classList.remove('nav-open');
      if (typeof dlg.close === 'function' && dlg.open) dlg.close(); else dlg.removeAttribute('open');
      if (state.opener && state.opener.focus) state.opener.focus();
    }

    function go(delta) {
      if (state.items.length < 2) return;
      state.index = (state.index + delta + state.items.length) % state.items.length;
      render();
    }

    on($('[data-lb-close]', dlg), 'click', close);
    on($('[data-lb-prev]', dlg), 'click', function () { go(-1); });
    on($('[data-lb-next]', dlg), 'click', function () { go(1); });
    on(dlg, 'cancel', function (e) { e.preventDefault(); close(); });
    on(dlg, 'keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
      else trapFocus(dlg, e);
    });
    on($('.lightbox__stage', dlg), 'click', function (e) {
      if (e.target === e.currentTarget) close();
    });

    if (fsBtn) {
      if (!doc.fullscreenEnabled) {
        fsBtn.hidden = true;
      } else {
        on(fsBtn, 'click', function () {
          if (doc.fullscreenElement) doc.exitFullscreen();
          else if (dlg.requestFullscreen) dlg.requestFullscreen();
        });
        on(doc, 'fullscreenchange', function () {
          var full = !!doc.fullscreenElement;
          fsBtn.setAttribute('aria-label', full ? 'Exit full screen' : 'View full screen');
          $('.icon-max', fsBtn).hidden = full;
          $('.icon-min', fsBtn).hidden = !full;
        });
      }
    }

    // Swipe
    var sx = null;
    var stage = $('.lightbox__stage', dlg);
    on(stage, 'touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    on(stage, 'touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      sx = null;
    }, { passive: true });

    return { open: open };
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function initLightbox() {
    lightbox = buildLightbox();
    if (!lightbox) return;
    on(doc, 'click', function (e) {
      var trigger = e.target.closest ? e.target.closest('[data-lightbox]') : null;
      if (!trigger) return;
      e.preventDefault();
      var group = trigger.getAttribute('data-lightbox');
      var all = $$('[data-lightbox="' + group + '"]').filter(function (el) {
        return !el.closest('[hidden]') && el.offsetParent !== null;
      });
      if (all.indexOf(trigger) === -1) all = [trigger];
      var items = all.map(function (el) {
        return { src: el.getAttribute('data-full'), alt: el.getAttribute('data-alt') || '', cat: el.getAttribute('data-cat') || '' };
      });
      lightbox.open(items, all.indexOf(trigger), trigger);
    });
  }

  /* ------------------------------------------------------------ Gallery filter */
  function initGalleryFilter() {
    var wrap = $('[data-gallery]');
    if (!wrap) return;
    var buttons = $$('[data-filter]', wrap);
    var items = $$('[data-cat-key]', wrap);
    var status = $('[data-gallery-status]', wrap);
    function apply(key, focusBtn) {
      var shown = 0;
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-filter') === key ? 'true' : 'false'); });
      items.forEach(function (it) {
        var match = key === 'all' || it.getAttribute('data-cat-key') === key;
        if (match) {
          if (it.hidden) {
            it.hidden = false;
            if (!reduceMotion.matches) {
              var btn = $('.g-item', it);
              if (btn) { btn.classList.remove('is-entering'); void btn.offsetWidth; btn.classList.add('is-entering'); }
            }
          }
          shown++;
        } else {
          it.hidden = true;
        }
      });
      if (status) {
        var label = focusBtn ? focusBtn.getAttribute('data-label') : 'All projects';
        status.textContent = 'Showing ' + shown + ' ' + (shown === 1 ? 'photo' : 'photos') + ' — ' + label;
      }
      if (history.replaceState) {
        var url = key === 'all' ? location.pathname : location.pathname + '#' + key;
        history.replaceState(null, '', url);
      }
    }
    buttons.forEach(function (b) {
      on(b, 'click', function () { apply(b.getAttribute('data-filter'), b); });
    });
    function fromHash() {
      var key = (location.hash || '').replace('#', '');
      var btn = buttons.filter(function (b) { return b.getAttribute('data-filter') === key; })[0];
      if (btn) apply(key, btn);
    }
    fromHash();
    on(window, 'hashchange', fromHash);
  }

  /* ------------------------------------------------------------ Contact form */
  function initContactForm() {
    $$('[data-contact-form]').forEach(function (form) {
      var status = $('[data-form-status]', form);
      var endpoint = form.getAttribute('data-endpoint') || '';
      var email = form.getAttribute('data-email');
      var whatsapp = form.getAttribute('data-whatsapp');
      // Lengths come from each field's minlength / maxlength (set in sections.js, contactForm)
      function fits(el, v) {
        var min = el.minLength > 0 ? el.minLength : 0;
        var max = el.maxLength > 0 ? el.maxLength : Infinity;
        return v.length >= min && v.length <= max;
      }
      var fields = {
        // 2–50 characters, no digits
        name: { el: form.elements.name, test: function (v) { v = v.trim(); return fits(this.el, v) && !/\d/.test(v); } },
        email: { el: form.elements.email, test: function (v) { v = v.trim(); return fits(this.el, v) && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); } },
        // a 10-digit Indian mobile number (starting 6–9), optionally written with +91, 91 or 0 in front,
        // with spaces, dashes or brackets
        phone: { el: form.elements.phone, test: function (v) {
          v = v.trim();
          if (!fits(this.el, v) || !/^\+?[\d\s()-]+$/.test(v)) return false;
          var d = v.replace(/\D/g, '');
          if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
          else if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
          return /^[6-9]\d{9}$/.test(d);
        } },
        service: { el: form.elements.service, test: function (v) { return v !== ''; } },
        message: { el: form.elements.message, test: function (v) { return fits(this.el, v.trim()); } }
      };

      // Google reCAPTCHA ("I'm not a robot"), when the site has a key (contactForm in sections.js): it must
      // be ticked as well; ticking it, or the tick expiring, checks the button again. A tick is good for
      // one sending only, so the box is cleared after each try.
      var captcha = $('[data-captcha]', form);
      function captchaToken() {
        var box = form.elements['g-recaptcha-response'];
        return box && box.value ? box.value : '';
      }
      function resetCaptcha() {
        if (captcha && window.grecaptcha && window.grecaptcha.reset) {
          try { window.grecaptcha.reset(); } catch (err) { /* not ready yet */ }
        }
      }
      if (captcha) {
        window.biCaptchaChanged = function () {
          if (captchaToken()) captcha.classList.remove('is-invalid');
          updateSubmit();
        };
      }

      // The phone field accepts only digits, +, spaces, dashes and brackets as you type
      if (fields.phone.el) {
        on(fields.phone.el, 'input', function () {
          var el = fields.phone.el;
          var clean = el.value.replace(/[^\d+\s()-]/g, '');
          if (clean !== el.value) el.value = clean;
        });
      }

      // Pre-select the service when arriving from a service page (contact.html?service=printing)
      try {
        var key = new URLSearchParams(window.location.search).get('service');
        if (key && /^[a-z-]+$/.test(key) && form.elements.service) {
          var opt = form.elements.service.querySelector('option[data-key="' + key + '"]');
          if (opt) opt.selected = true;
        }
      } catch (err) { /* URLSearchParams not supported: ignore */ }

      function validate(name) {
        var f = fields[name];
        if (!f || !f.el) return true;
        var ok = f.test(f.el.value || '');
        var wrap = f.el.closest('.field');
        wrap.classList.toggle('is-invalid', !ok);
        f.el.setAttribute('aria-invalid', ok ? 'false' : 'true');
        return ok;
      }

      // Send Enquiry stays disabled until every field (all are required) is filled in correctly; it
      // is checked quietly on each keystroke, without marking fields red. Without JavaScript the
      // button always works.
      var submitBtn = $('[type="submit"]', form);
      var sending = false;
      function allValid() {
        return Object.keys(fields).every(function (name) {
          var f = fields[name];
          return !f.el || f.test(f.el.value || '');
        }) && (!captcha || captchaToken() !== '');
      }
      function updateSubmit() {
        if (submitBtn) submitBtn.disabled = sending || !allValid();
      }

      Object.keys(fields).forEach(function (name) {
        var el = fields[name].el;
        if (!el) return;
        on(el, 'blur', function () { if (el.value) validate(name); });
        on(el, 'input', function () {
          if (el.closest('.field').classList.contains('is-invalid')) validate(name);
          updateSubmit();
        });
        on(el, 'change', function () {
          if (el.closest('.field').classList.contains('is-invalid')) validate(name);
          updateSubmit();
        });
      });
      // after a reset (once an enquiry is sent) the fields are empty again
      on(form, 'reset', function () { window.setTimeout(updateSubmit, 0); });
      updateSubmit();

      function showStatus(type, html) {
        status.className = 'form-status form-status--' + type + ' is-visible';
        status.innerHTML = html;
      }

      function composeBody(data) {
        return 'Name: ' + data.name + '\nEmail: ' + data.email + '\nPhone: ' + data.phone +
          '\nService: ' + data.service + '\n\nMessage:\n' + data.message;
      }

      on(form, 'submit', function (e) {
        e.preventDefault();
        var firstInvalid = null;
        Object.keys(fields).forEach(function (name) {
          if (!validate(name) && !firstInvalid) firstInvalid = fields[name].el;
        });
        if (firstInvalid) {
          showStatus('error', '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg><div><strong>Please check the highlighted fields.</strong>Some required information is missing or incomplete.</div>');
          firstInvalid.focus();
          return;
        }
        if (captcha && !captchaToken()) {
          captcha.classList.add('is-invalid');
          showStatus('error', '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg><div><strong>Please tick “I’m not a robot”.</strong>It tells us the enquiry comes from a person.</div>');
          return;
        }
        var data = {
          name: form.elements.name.value.trim(),
          email: form.elements.email.value.trim(),
          phone: form.elements.phone.value.trim(),
          service: form.elements.service.value,
          message: form.elements.message.value.trim()
        };
        if (endpoint) {
          // A mailer is set (send-enquiry.php): it emails the enquiry and answers { ok, message }.
          // While it works the button reads "Sending…" and stays disabled.
          var label = $('span', submitBtn);
          var labelText = label ? label.textContent : '';
          sending = true;
          updateSubmit();
          if (label) label.textContent = 'Sending…';
          status.className = 'form-status';
          fetch(endpoint, {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: new FormData(form)
          }).then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (reply) {
              if (!res.ok || !reply.ok) throw new Error('Request failed');
            });
          }).then(function () {
            form.reset();
            resetCaptcha();
            showStatus('success', '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg><div><strong>Your enquiry has been successfully submitted!</strong>Thank you, ' + escapeHtml(data.name) + '. The Brand Image team will get in touch with you shortly to resolve your enquiry.</div>');
          }).catch(function () {
            resetCaptcha();
            showStatus('error', '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg><div><strong>Sorry, your enquiry could not be sent.</strong>Please try again, email <a href="mailto:' + email + '">' + email + '</a> or call us directly.</div>');
          }).then(function () {
            sending = false;
            if (label) label.textContent = labelText;
            updateSubmit();
          });
          return;
        }

        // Static site: hand the enquiry over to the visitor's email app.
        var subject = 'Website enquiry: ' + data.service + ' — ' + data.name;
        var mailto = 'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(composeBody(data));
        var wa = 'https://wa.me/' + whatsapp + '?text=' + encodeURIComponent('Hello Brand Image Media Pvt Ltd,\n\n' + composeBody(data));
        showStatus('success', '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg><div><strong>Almost done — your email app is opening with your enquiry.</strong>Just press send. If nothing opened, <a href="' + mailto + '">send it by email</a> or <a href="' + wa + '" target="_blank" rel="noopener noreferrer">send it on WhatsApp</a>.</div>');
        window.location.href = mailto;
      });
    });
  }

  /* ------------------------------------------------------------ Blog article */
  // On an article (src/pages/blog.js): the orange line under the header fills as the article is read,
  // "In this article" marks the section being read, and the copy button copies the article's address.
  function initArticle() {
    var body = $('.post-body');
    if (!body) return;
    var bar = $('.read-progress');
    var header = $('.site-header');
    var pairs = $$('.post-toc a').map(function (a) {
      return { link: a, section: doc.getElementById(a.getAttribute('href').slice(1)) };
    }).filter(function (p) { return p.section; });

    var ticking = false;
    function update() {
      ticking = false;
      var top = header ? header.offsetHeight : 0;
      var view = window.innerHeight - top;
      var rect = body.getBoundingClientRect();
      // 0 when the article's top reaches the header, 1 when its end reaches the bottom of the window
      var read = (top - rect.top) / Math.max(1, rect.height - view);
      if (bar) bar.style.setProperty('--read', Math.min(1, Math.max(0, read)).toFixed(4));
      // the section being read: the last one whose heading has passed a line a little under the header
      var current = null;
      pairs.forEach(function (p) { if (p.section.getBoundingClientRect().top <= top + 140) current = p; });
      pairs.forEach(function (p) {
        var active = p === current;
        p.link.classList.toggle('is-active', active);
        if (active) p.link.setAttribute('aria-current', 'location');
        else p.link.removeAttribute('aria-current');
      });
    }
    function request() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }
    on(window, 'scroll', request, { passive: true });
    on(window, 'resize', request);
    update();

    // Share the address the article is open at: the links are built with the live address
    // (config.siteUrl), which does not have the article before the site is published there, nor on a
    // preview (localhost, a tunnel)
    var here = /^https?:$/.test(window.location.protocol) ? window.location.origin + window.location.pathname : null;
    $$('.post-share').forEach(function (share) {
      var copy = $('[data-copy-link]', share);
      var built = copy && copy.getAttribute('data-copy-link');
      if (!here || !built || built === here) return;
      copy.setAttribute('data-copy-link', here);
      $$('a', share).forEach(function (a) {
        a.setAttribute('href', a.getAttribute('href').split(encodeURIComponent(built)).join(encodeURIComponent(here)));
      });
    });

    $$('[data-copy-link]').forEach(function (btn) {
      var share = btn.parentNode;
      var done = $('.post-share__done', btn);
      var timer;
      // "Link copied" in place of "Share" and a tick on the button for a moment (11-blog.css)
      function show(ok, url) {
        if (!ok) { window.prompt('Copy the link to this article:', url); return; }
        if (done) done.textContent = 'Link copied';
        share.classList.add('is-copied');
        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
          share.classList.remove('is-copied');
          if (done) done.textContent = '';
        }, 2200);
      }
      on(btn, 'click', function () {
        var url = btn.getAttribute('data-copy-link');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () { show(true, url); }, function () { show(false, url); });
          return;
        }
        var field = doc.createElement('textarea');
        field.value = url;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        doc.body.appendChild(field);
        field.select();
        var ok = false;
        try { ok = doc.execCommand('copy'); } catch (err) { ok = false; }
        doc.body.removeChild(field);
        show(ok, url);
      });
    });
  }

  /* ------------------------------------------------------------ Mobile CTA bar */
  function initMobileCta() {
    var bar = $('.mobile-cta');
    if (!bar) return;
    // Hide the bar while a form field is focused so it never covers the keyboard area.
    on(doc, 'focusin', function (e) {
      if (e.target.matches && e.target.matches('input, textarea, select')) bar.classList.add('is-hidden');
    });
    on(doc, 'focusout', function (e) {
      if (e.target.matches && e.target.matches('input, textarea, select')) bar.classList.remove('is-hidden');
    });
    // Slide the bar away while the footer is on screen: the footer shows the same ways to call and
    // WhatsApp, and the bar would otherwise sit on top of it.
    var footer = $('.site-footer');
    if (footer && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        bar.classList.toggle('is-at-footer', entries[0].isIntersecting);
      }).observe(footer);
    }
  }

  function init() {
    initHeader();
    initNavIndicator();
    initMegaMenu();
    initMobileNav();
    initReveal();
    initCounters();
    initLive();
    initServiceCycle();
    initServiceFlow();
    initArticle();
    initLightbox();
    initGalleryFilter();
    initContactForm();
    initMobileCta();
    var year = $('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})();
