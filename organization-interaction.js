/* =============================================================================
   BLC — ORGANIZATIONAL STRUCTURE — INTERACTION LAYER
   Phase: 03 (Slider, filters, keyboard/touch, dots)

   Consumes window.BLCOrgData (organization-data.js) and reuses
   window.BLCOrgSection's card renderer / bilingual-span helpers
   (organization-section.js) — no data model or card visual design is
   redefined here, per the Phase 03 brief ("do not rebuild previous work").

   This script REPLACES the contents of #organization-mount (previously the
   Phase 02 static spotlight+grid layout) with a horizontal slider:

     [prev] [inactive][inactive][ACTIVE][inactive][inactive] [next]
                          dots: o o o (o) o o o

   and builds the department filter chips into #organization-filters.

   Scope discipline (per the Phase 03 brief):
     - No employee names/photos/bios are invented anywhere in this file —
       every record still comes straight from window.BLCOrgData.
     - No LinkedIn/profile links are created — this file does not touch the
       `linkedin`/`email`/`phone` fields at all.
   ============================================================================= */

(function (global, document) {
  'use strict';

  /* ---------------------------------------------------------------------
     BILINGUAL UI STRINGS
     Small, self-contained i18n table for the controls this file introduces
     (filters group, carousel region, arrows, dots, live-region status).
     Kept independent of the page's global setLang() so this file does not
     need to modify unrelated code — a MutationObserver (below) simply
     re-reads document.documentElement.lang whenever setLang() changes it.
     --------------------------------------------------------------------- */
  var STRINGS = {
    en: {
      filterGroupLabel: 'Filter organizational structure by department',
      carouselLabel: 'Organizational structure members',
      prevLabel: 'Previous member',
      nextLabel: 'Next member',
      dotLabel: function (member) {
        return 'Show ' + (member.position || 'member') + ', ' + member.department;
      },
      cardLabel: function (member, isActive) {
        var base = (member.name || 'BLC') + ', ' + member.position + ', ' + member.department;
        return isActive ? base + ' (currently shown)' : base;
      },
      announce: function (member) {
        return 'Now showing ' + (member.name || 'BLC') + ', ' + member.position + ', ' + member.department + '.';
      },
      noResults: 'No members found for this department yet.'
    },
    ar: {
      filterGroupLabel: 'تصفية الهيكل التنظيمي حسب القسم',
      carouselLabel: 'أعضاء الهيكل التنظيمي',
      prevLabel: 'العضو السابق',
      nextLabel: 'العضو التالي',
      dotLabel: function (member) {
        return 'عرض ' + (member.positionAr || 'عضو') + '، ' + member.departmentAr;
      },
      cardLabel: function (member, isActive) {
        var base = (member.nameAr || 'BLC') + '، ' + member.positionAr + '، ' + member.departmentAr;
        return isActive ? base + ' (المعروض حاليًا)' : base;
      },
      announce: function (member) {
        return 'يُعرض الآن ' + (member.nameAr || 'BLC') + '، ' + member.positionAr + '، ' + member.departmentAr + '.';
      },
      noResults: 'لا يوجد أعضاء لهذا القسم بعد.'
    }
  };

  function lang() {
    return document.documentElement.lang === 'ar' ? 'ar' : 'en';
  }
  function t() {
    return STRINGS[lang()];
  }

  /* ---------------------------------------------------------------------
     FILTER DEFINITIONS
     Exact EN/AR labels per the Phase 03 brief. These are UI chip labels,
     intentionally distinct from the fuller department names already used
     inside each card (window.BLCOrgData.CATEGORIES) — e.g. the QA/QC chip
     reads "الجودة" while the card body keeps the fuller "ضمان وضبط الجودة".
     ids map 1:1 to BLCOrgData.CATEGORIES ids so filtering can reuse the
     existing data-department-id already written onto every card by
     organization-section.js's renderCard(). "Executive" has no chip, per
     the brief's filter list, but its member still shows under "ALL".
     --------------------------------------------------------------------- */
  var FILTER_DEFS = [
    { id: 'all',         en: 'ALL',         ar: 'الكل' },
    { id: 'operations',  en: 'OPERATIONS',  ar: 'العمليات' },
    { id: 'engineering', en: 'ENGINEERING', ar: 'الهندسة' },
    { id: 'hse',         en: 'HSE',         ar: 'HSE' },
    { id: 'qaqc',        en: 'QA/QC',       ar: 'الجودة' },
    { id: 'commercial',  en: 'COMMERCIAL',  ar: 'العقود والتجاري' },
    { id: 'hr',          en: 'HR',          ar: 'الموارد البشرية' },
    { id: 'finance',     en: 'FINANCE',     ar: 'المالية' },
    { id: 'procurement', en: 'PROCUREMENT', ar: 'المشتريات والمواد' },
    { id: 'training',    en: 'TRAINING',    ar: 'التدريب' },
    { id: 'digital',     en: 'DIGITAL',     ar: 'الرقمنة' }
  ];

  var SWIPE_THRESHOLD_PX = 40;

  function init() {
    var filtersMount = document.getElementById('organization-filters');
    var mount = document.getElementById('organization-mount');
    var liveRegion = document.querySelector('[data-org-live]');

    if (!filtersMount || !mount || !global.BLCOrgData || !global.BLCOrgSection) return;

    var renderCard = global.BLCOrgSection.renderCard;
    var bilingual = global.BLCOrgSection.bilingual;
    var el = global.BLCOrgSection.el;
    if (typeof renderCard !== 'function' || typeof bilingual !== 'function' || typeof el !== 'function') return;

    var ALL_MEMBERS = global.BLCOrgData.MEMBERS.slice().sort(function (a, b) {
      return a.level - b.level || a.order - b.order;
    });
    if (!ALL_MEMBERS.length) return;

    var state = { filter: 'all', activeIndex: 0 };
    var els = {};
    var cardEls = [];   // all rendered card elements, in ALL_MEMBERS order
    var dotEls = [];    // rebuilt whenever the filter changes

    /* ---- helpers ---------------------------------------------------- */

    function deptIdOf(cardEl) {
      return cardEl.getAttribute('data-department-id');
    }

    function visibleCards() {
      return cardEls.filter(function (c) { return !c.hidden; });
    }

    function memberForCard(cardEl) {
      var idx = cardEls.indexOf(cardEl);
      return ALL_MEMBERS[idx];
    }

    /** Maps a raw input direction to a logical step (+1/-1), accounting for
     *  the page's current text direction so ArrowRight/swipe-left always
     *  move toward the visually "forward" neighbor, in LTR or RTL. */
    function visualStep(direction) {
      var isRtl = document.documentElement.dir === 'rtl';
      if (direction === 'forward') return isRtl ? -1 : 1;
      return isRtl ? 1 : -1;
    }

    /* ---- building the static DOM shell (once) ------------------------ */

    function buildFilters() {
      filtersMount.setAttribute('role', 'group');
      filtersMount.setAttribute('aria-label', t().filterGroupLabel);
      filtersMount.innerHTML = '';

      FILTER_DEFS.forEach(function (def) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'org-filter-btn';
        btn.setAttribute('data-org-filter', def.id);
        btn.setAttribute('aria-pressed', def.id === 'all' ? 'true' : 'false');
        btn.appendChild(bilingual(def.en, def.ar));
        btn.addEventListener('click', function () { applyFilter(def.id); });
        filtersMount.appendChild(btn);
      });
    }

    function buildSlider() {
      mount.innerHTML = '';

      var slider = el('div', 'org-slider');
      slider.setAttribute('data-org-slider', '');

      var prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'org-arrow org-arrow-prev';
      prevBtn.setAttribute('data-org-prev', '');
      prevBtn.setAttribute('aria-label', t().prevLabel);
      prevBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
      prevBtn.addEventListener('click', function () { step(-1, { focus: false }); });

      var nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'org-arrow org-arrow-next';
      nextBtn.setAttribute('data-org-next', '');
      nextBtn.setAttribute('aria-label', t().nextLabel);
      nextBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
      nextBtn.addEventListener('click', function () { step(1, { focus: false }); });

      var viewport = el('div', 'org-viewport');
      viewport.setAttribute('data-org-viewport', '');
      viewport.setAttribute('tabindex', '0');
      viewport.setAttribute('role', 'region');
      viewport.setAttribute('aria-roledescription', 'carousel');
      viewport.setAttribute('aria-label', t().carouselLabel);

      var track = el('div', 'org-track');
      track.setAttribute('data-org-track', '');

      cardEls = ALL_MEMBERS.map(function (member) {
        var card = renderCard(member, 'inactive');
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.addEventListener('click', function () { activateCard(card, { focus: false }); });
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            activateCard(card, { focus: false });
          }
        });
        track.appendChild(card);
        return card;
      });

      viewport.appendChild(track);
      slider.appendChild(prevBtn);
      slider.appendChild(viewport);
      slider.appendChild(nextBtn);

      var dots = el('div', 'org-dots');
      dots.setAttribute('data-org-dots', '');
      dots.setAttribute('role', 'tablist');
      dots.setAttribute('aria-label', t().carouselLabel);

      mount.appendChild(slider);
      mount.appendChild(dots);

      els.slider = slider;
      els.prevBtn = prevBtn;
      els.nextBtn = nextBtn;
      els.viewport = viewport;
      els.track = track;
      els.dots = dots;

      /* Keyboard nav: attached once on the viewport; bubbles up from any
         focused card inside it, so it works whether focus is on the
         viewport region itself or on an individual card. */
      viewport.addEventListener('keydown', function (e) {
        switch (e.key) {
          case 'ArrowRight':
            e.preventDefault();
            step(visualStep('forward'), { focus: true });
            break;
          case 'ArrowLeft':
            e.preventDefault();
            step(visualStep('backward'), { focus: true });
            break;
          case 'Home':
            e.preventDefault();
            goTo(0, { focus: true });
            break;
          case 'End':
            e.preventDefault();
            goTo(visibleCards().length - 1, { focus: true });
            break;
        }
      });

      /* Touch / swipe support. */
      var touch = { active: false, startX: 0, startY: 0, dx: 0, dy: 0 };
      viewport.addEventListener('touchstart', function (e) {
        if (!e.touches || !e.touches.length) return;
        touch.active = true;
        touch.startX = e.touches[0].clientX;
        touch.startY = e.touches[0].clientY;
        touch.dx = 0;
        touch.dy = 0;
      }, { passive: true });

      viewport.addEventListener('touchmove', function (e) {
        if (!touch.active || !e.touches || !e.touches.length) return;
        touch.dx = e.touches[0].clientX - touch.startX;
        touch.dy = e.touches[0].clientY - touch.startY;
        // Only claim the gesture (block page scroll) once it's clearly horizontal.
        if (Math.abs(touch.dx) > Math.abs(touch.dy) && Math.abs(touch.dx) > 10) {
          e.preventDefault();
        }
      }, { passive: false });

      viewport.addEventListener('touchend', function () {
        if (!touch.active) return;
        touch.active = false;
        if (Math.abs(touch.dx) > Math.abs(touch.dy) && Math.abs(touch.dx) > SWIPE_THRESHOLD_PX) {
          var direction = touch.dx < 0 ? 'forward' : 'backward';
          step(visualStep(direction), { focus: false });
        }
      });

      window.addEventListener('resize', debounce(function () { updateTransform(); }, 120), { passive: true });

      /* Positioning is handled entirely via the track's CSS transform, never
         native scrolling — but some browsers still adjust an overflow:hidden
         ancestor's scrollLeft on their own when a descendant receives focus
         (e.g. clicking or tab-focusing a card), which would silently fight
         the transform and visually misplace the active card. Neutralize
         that unconditionally. */
      viewport.addEventListener('scroll', function () {
        if (viewport.scrollLeft !== 0) viewport.scrollLeft = 0;
      }, { passive: true });
    }

    function debounce(fn, wait) {
      var timer = null;
      return function () {
        var args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () { fn.apply(null, args); }, wait);
      };
    }

    /* ---- filtering ----------------------------------------------------- */

    function applyFilter(filterId) {
      state.filter = filterId;

      cardEls.forEach(function (card) {
        var dept = deptIdOf(card);
        card.hidden = !(filterId === 'all' || dept === filterId);
      });

      Array.prototype.forEach.call(filtersMount.children, function (btn) {
        var isActive = btn.getAttribute('data-org-filter') === filterId;
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      buildDots();
      goTo(0, { focus: false, silent: true });
    }

    /* ---- dots ------------------------------------------------------ */

    function buildDots() {
      els.dots.innerHTML = '';
      dotEls = [];
      visibleCards().forEach(function (card, i) {
        var member = memberForCard(card);
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'org-dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', t().dotLabel(member));
        dot.setAttribute('aria-selected', i === state.activeIndex ? 'true' : 'false');
        dot.addEventListener('click', function () { goTo(i, { focus: false }); });
        els.dots.appendChild(dot);
        dotEls.push(dot);
      });
    }

    function refreshDots() {
      dotEls.forEach(function (dot, i) {
        dot.setAttribute('aria-selected', i === state.activeIndex ? 'true' : 'false');
      });
    }

    /* ---- active-card state / positioning ---------------------------- */

    function activateCard(card, opts) {
      var idx = visibleCards().indexOf(card);
      if (idx === -1) return;
      goTo(idx, opts);
    }

    function step(delta, opts) {
      goTo(state.activeIndex + delta, opts);
    }

    function goTo(index, opts) {
      opts = opts || {};
      var vc = visibleCards();
      if (!vc.length) {
        announce(t().noResults);
        return;
      }
      index = Math.max(0, Math.min(index, vc.length - 1));
      state.activeIndex = index;

      vc.forEach(function (card, i) {
        var dist = Math.abs(i - index);
        var isActive = i === index;
        var member = memberForCard(card);
        card.setAttribute('data-state', isActive ? 'active' : 'inactive');
        card.setAttribute('data-distance', dist === 0 ? '0' : dist === 1 ? '1' : dist === 2 ? '2' : 'far');
        card.setAttribute('aria-current', isActive ? 'true' : 'false');
        card.setAttribute('aria-label', t().cardLabel(member, isActive));
      });

      updateTransform();
      refreshDots();
      updateArrowState(vc, index);

      if (opts.focus) {
        vc[index].focus({ preventScroll: true });
      }
      if (!opts.silent) {
        announce(t().announce(memberForCard(vc[index])));
      }
    }

    function updateArrowState(vc, index) {
      els.prevBtn.disabled = index <= 0;
      els.nextBtn.disabled = index >= vc.length - 1;
      els.prevBtn.setAttribute('aria-disabled', String(els.prevBtn.disabled));
      els.nextBtn.setAttribute('aria-disabled', String(els.nextBtn.disabled));
    }

    function updateTransform() {
      var vc = visibleCards();
      var idx = state.activeIndex;
      if (!vc[idx]) return;

      // Compute the offset algebraically from the CSS custom properties
      // that define card sizing (see .org-track in index.html), rather than
      // measuring live offsetLeft/offsetWidth: the cards' own width
      // transitions (`.org-card{ transition:all .45s }`) mean a DOM
      // measurement taken right after a [data-state] change can catch a
      // mid-transition frame and mis-center the active card. Custom
      // properties don't animate, so this is race-free.
      var trackStyle = getComputedStyle(els.track);
      var gap = parseFloat(trackStyle.getPropertyValue('--org-gap')) || 20;
      var cardW = parseFloat(trackStyle.getPropertyValue('--org-card-w')) || 220;
      var activeW = parseFloat(trackStyle.getPropertyValue('--org-card-active-w')) || 300;

      // Every card before the active one is the (uniform) inactive width,
      // since only one card is ever active at a time. This is a distance
      // from the row's *inline-start* edge — which is the physical left
      // edge in LTR but the physical right edge in RTL, since flex-start
      // in a row container follows text direction and browsers mirror the
      // child order accordingly. Convert to a physical (left-based) center
      // depending on current direction.
      var cumulativeFromStart = idx * (cardW + gap);
      var viewportWidth = els.viewport.clientWidth;
      var isRtl = document.documentElement.dir === 'rtl';
      var cardCenter = isRtl
        ? viewportWidth - cumulativeFromStart - activeW / 2
        : cumulativeFromStart + activeW / 2;
      var targetX = (viewportWidth / 2) - cardCenter;
      els.track.style.transform = 'translateX(' + targetX + 'px)';
    }

    function announce(msg) {
      if (liveRegion) liveRegion.textContent = msg;
    }

    /* ---- language changes -------------------------------------------
       The page's global setLang() (see the inline <script> near the
       footer) flips document.documentElement.lang/dir. We watch for that
       instead of modifying setLang(), so this file's UI strings and
       aria-labels stay in sync without touching unrelated code. */
    var langObserver = new MutationObserver(function () {
      filtersMount.setAttribute('aria-label', t().filterGroupLabel);
      els.viewport.setAttribute('aria-label', t().carouselLabel);
      els.dots.setAttribute('aria-label', t().carouselLabel);
      els.prevBtn.setAttribute('aria-label', t().prevLabel);
      els.nextBtn.setAttribute('aria-label', t().nextLabel);
      visibleCards().forEach(function (card, i) {
        var member = memberForCard(card);
        card.setAttribute('aria-label', t().cardLabel(member, i === state.activeIndex));
      });
      dotEls.forEach(function (dot, i) {
        var vc = visibleCards();
        if (vc[i]) dot.setAttribute('aria-label', t().dotLabel(memberForCard(vc[i])));
      });
      updateTransform();
    });
    langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    /* ---- boot --------------------------------------------------------- */
    buildFilters();
    buildSlider();
    buildDots();
    goTo(0, { focus: false, silent: true });

    // Re-apply bilingual visibility to the newly-inserted markup, the same
    // way organization-section.js does after its own render.
    if (typeof global.setLang === 'function') {
      global.setLang(document.documentElement.lang || 'en');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
