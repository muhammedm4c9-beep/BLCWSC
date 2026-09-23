/* =============================================================================
   BLC — ORGANIZATIONAL STRUCTURE — VISUAL LAYER

   Renders static department cards from window.BLCOrgData (organization-data.js
   must load first — see index.html). One "active"/spotlight card (the most
   senior record, level 1) plus a responsive grid of "inactive" cards for the
   remaining departments. organization-interaction.js (Phase 03) reuses
   renderCard()/bilingual()/el() from here to build the interactive slider,
   so this file stays the single source of truth for card markup.

   Phase 05 addition: renderCard() now also renders a small "LEVEL 0X" kicker
   per card (from the existing member.level field) that ties each card back
   to the static hierarchy key in index.html's #organization section header.
   ============================================================================= */

(function (global) {
  'use strict';

  /* Neutral placeholder used in place of a real name — this is the BLC brand
     initialism, not a fabricated person, per the Phase 02 brief ("neutral
     professional placeholders"). */
  var PLACEHOLDER_NAME = 'BLC';

  /**
   * @param {string} tag
   * @param {string} [className]
   * @returns {HTMLElement}
   */
  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  /**
   * Builds a bilingual <span data-lang="en">/<span data-lang="ar"> pair the
   * way the rest of the site marks up translatable text, so the existing
   * global setLang() toggle (see the inline <script> near the footer) works
   * on this dynamically-inserted content without any changes to that script.
   * @param {string} en
   * @param {string} ar
   * @returns {DocumentFragment}
   */
  function bilingual(en, ar) {
    var frag = document.createDocumentFragment();
    var enSpan = el('span');
    enSpan.setAttribute('data-lang', 'en');
    enSpan.textContent = en;
    var arSpan = el('span');
    arSpan.setAttribute('data-lang', 'ar');
    arSpan.setAttribute('data-lang-hide', '');
    arSpan.textContent = ar;
    frag.appendChild(enSpan);
    frag.appendChild(arSpan);
    return frag;
  }

  /**
   * @param {import('./organization-data.js').OrganizationMember} member
   * @param {'active'|'inactive'} state
   * @returns {HTMLElement}
   */
  function renderCard(member, state) {
    var card = el('article', 'org-card');
    card.setAttribute('data-org-card', '');
    card.setAttribute('data-department-id', member.id.replace(/-placeholder-\d+$/, ''));
    card.setAttribute('data-state', state);

    var avatar = el('div', 'org-card-avatar');
    var img = document.createElement('img');
    img.src = member.image || (global.BLCOrgData && global.BLCOrgData.PLACEHOLDER_IMAGE) || '';
    img.alt = '';
    img.loading = 'lazy';
    avatar.appendChild(img);

    // Phase 05: subtle "LEVEL 0X" kicker tying each card back to the section's
    // hierarchy key (see the static legend in index.html). Reads member.level,
    // which already exists on every record — no data model change needed.
    var level = el('div', 'org-card-level');
    if (member.level != null) {
      var levelNum = member.level < 10 ? '0' + member.level : String(member.level);
      level.appendChild(bilingual('LEVEL ' + levelNum, 'المستوى ' + levelNum));
    }

    var name = el('div', 'org-card-name');
    name.appendChild(bilingual(
      member.name || PLACEHOLDER_NAME,
      member.nameAr || PLACEHOLDER_NAME
    ));

    var position = el('div', 'org-card-position');
    position.appendChild(bilingual(member.position, member.positionAr));

    var dept = el('div', 'org-card-dept');
    dept.appendChild(bilingual(member.department, member.departmentAr));

    var bio = el('p', 'org-card-bio');
    bio.appendChild(bilingual(member.bio || '', member.bioAr || ''));

    card.appendChild(avatar);
    if (member.level != null) card.appendChild(level);
    card.appendChild(name);
    card.appendChild(position);
    card.appendChild(dept);
    card.appendChild(bio);
    return card;
  }

  var BLCOrgSection = {
    /**
     * Mounts the static organization card layout into the given container.
     * @param {string} mountElementId  e.g. 'organization-mount'
     */
    init: function (mountElementId) {
      var mount = document.getElementById(mountElementId);
      if (!mount || !global.BLCOrgData) return;

      var members = global.BLCOrgData.MEMBERS.slice().sort(function (a, b) {
        return a.level - b.level || a.order - b.order;
      });
      if (!members.length) return;

      var spotlightMember = members[0];
      var gridMembers = members.slice(1);

      var spotlightWrap = el('div', 'org-spotlight');
      spotlightWrap.appendChild(renderCard(spotlightMember, 'active'));

      var grid = el('div', 'org-grid');
      gridMembers.forEach(function (member) {
        grid.appendChild(renderCard(member, 'inactive'));
      });

      mount.innerHTML = '';
      mount.appendChild(spotlightWrap);
      mount.appendChild(grid);

      // The cards above were inserted after the page's initial setLang() call
      // already ran, so re-apply the current language to every [data-lang]
      // element (existing content included — this is idempotent) using the
      // site's own global setLang(), rather than re-implementing that logic.
      if (typeof global.setLang === 'function') {
        var currentLang = document.documentElement.lang || 'en';
        global.setLang(currentLang);
      }
    }
  };

  // Expose the internal helpers too (unchanged behavior) so Phase 03's
  // interaction layer (assets/js/organization-interaction.js) can reuse the
  // exact same card markup/bilingual-span logic instead of re-implementing
  // it — per the Phase 03 brief ("do not rebuild previous work").
  BLCOrgSection.renderCard = renderCard;
  BLCOrgSection.bilingual = bilingual;
  BLCOrgSection.el = el;
  BLCOrgSection.PLACEHOLDER_NAME = PLACEHOLDER_NAME;

  global.BLCOrgSection = BLCOrgSection;

  // Self-initialize: this script is loaded with `defer`, so the DOM (including
  // #organization-mount) is already parsed by the time this executes. This
  // renders the Phase 02 static layout first; if present, Phase 03's
  // organization-interaction.js then replaces #organization-mount's content
  // with the interactive slider (see that file). If that script fails to
  // load for any reason, this static render remains as a working fallback.
  BLCOrgSection.init('organization-mount');

})(window);
