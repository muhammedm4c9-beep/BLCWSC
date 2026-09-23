/* =============================================================================
   HERO CINEMATIC SEQUENCE ENGINE
   ---------------------------------------------------------------------------
   Plays the 12 supplied clips back-to-back inside the EXISTING hero video
   system (#heroVideo) as one continuous cinematic journey:

     SPACE -> REGION -> IRAQ -> BASRA -> RUMAILA -> OIL FIELD -> FACILITY -> ARRIVAL -> CREW ON GROUND -> TEAM PORTRAIT

   Architecture: double-buffered <video> crossfade.
     #heroVideo  (existing element) = buffer A, also the no-JS / failure fallback
                                       (keeps its original <source> tags, so if
                                       this script never runs the hero still
                                       plays the original looping background video).
     #heroVideoB (added element)    = buffer B, used purely by this engine.

   At any time one buffer is playing and visible while the other is silently
   preloading the next clip in the sequence. Shortly before the visible clip
   ends, the engine starts the preloaded buffer, cross-fades opacity between
   the two, then hands control over. This produces a continuous, seamless
   cinematic story with no black frames, no reloads and no user interaction.

   This file does not touch any other part of the site. It only drives the
   two video elements already present in the Hero markup. If anything here
   fails, the existing #heroVideo fallback logic (SVG background) and the
   original loop still apply untouched.
   ========================================================================= */
(function () {
  'use strict';

  var videoA = document.getElementById('heroVideo');
  var videoB = document.getElementById('heroVideoB');
  if (!videoA || !videoB || !window.HTMLVideoElement) return;

  // Respect reduced-motion: leave the original single looping hero video
  // (or paused poster) exactly as the existing fallback script sets it up.
  var reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedQuery.matches) return;

  var BASE = 'assets/videos/sequence/';
  var CROSSFADE_MS = 900; // premium, restrained dissolve — not a flashy cut
  var CROSSFADE_S = CROSSFADE_MS / 1000;

  // The cinematic story, in exact order. Filenames match the files actually
  // supplied and copied into assets/videos/sequence/.
  var sequence = [
    BASE + '01-earth-orbit.mp4',        // 01 — Earth from space at dawn
    BASE + '02-iraq-outline.mp4',       // 02 — Zoom toward Iraq, glowing gold outline
    BASE + '03-tigris-euphrates.mp4',   // 03 — Tigris & Euphrates, Iraqi terrain
    BASE + '04-basra-map.mp4',          // 04 — Basra governorate, city, Umm Qasr
    BASE + '05-rumaila-site.mp4',       // 05 — South Rumaila field/site diagram
    BASE + '06-oilfield-aerial.mp4',    // 06 — Real aerial footage of the oil field
    BASE + '07-helicopter-approach.mp4',// 07 — VIP helicopter approaching the platform
    BASE + '08-helicopter-landing.mp4', // 08 — Helicopter landing, dust, workers
    BASE + '09-helicopter-arrival.mp4', // 09 — Helicopter on the ground, arrival
    BASE + '10-post-landing-crew.mp4',  // 10 — Rotors winding down, crew gathering at the facility
    BASE + '11-team-lineup.mp4',        // 11 — Full crew lineup portrait in front of the helicopter
    BASE + '12-team-applause.mp4'       // 12 — Crew applauding — closing shot
  ];

  var total = sequence.length;
  var current = { el: videoA, idx: 0 };
  var next = { el: videoB, idx: 1 };
  var switching = false;
  var failCount = 0;
  var MAX_FAILS = 3; // if too many clips fail in a row, stand down gracefully

  // Fires exactly when clip 01 (earth-orbit) becomes the active buffer — i.e.
  // the moment a fresh cycle begins, whether that's the very first play or a
  // wrap-around after clip 12. Nothing in this file listens for it; it exists
  // purely so other scripts (see the hero overlay-text fade near the end of
  // index.html) can sync to the sequence without this engine knowing or
  // caring who's listening.
  function announceCycleStart() {
    if (current.idx !== 0) return;
    try { document.dispatchEvent(new CustomEvent('heroVideoCycleStart')); } catch (e) {}
  }

  function safePlay(el) {
    var p = el.play();
    if (p && typeof p.catch === 'function') p.catch(function () {});
  }

  function loadClip(el, idx) {
    el.src = sequence[idx];
    el.preload = 'auto';
    el.load();
  }

  function preloadNext() {
    next.idx = (current.idx + 1) % total;
    loadClip(next.el, next.idx);
  }

  function crossfadeToNext() {
    if (switching) return;
    switching = true;

    safePlay(next.el);
    next.el.style.opacity = '1';
    current.el.style.opacity = '0';

    window.setTimeout(function () {
      current.el.pause();
      var finished = current; // becomes the new background buffer
      current = next;
      next = finished;
      switching = false;
      announceCycleStart();
      preloadNext();
    }, CROSSFADE_MS);
  }

  function nearEnd(el) {
    if (!el.duration || isNaN(el.duration) || !isFinite(el.duration)) return false;
    return el.currentTime >= (el.duration - CROSSFADE_S - 0.05);
  }

  function onTimeUpdate(e) {
    var el = e.currentTarget;
    if (el !== current.el || switching) return;
    if (nearEnd(el)) crossfadeToNext();
  }

  // Ended is a safety net in case timeupdate granularity misses the window
  // (e.g. background tab throttling) — advance the story instead of stalling.
  function onEnded(e) {
    var el = e.currentTarget;
    if (el !== current.el || switching) return;
    crossfadeToNext();
  }

  function onError(e) {
    var el = e.currentTarget;
    failCount += 1;
    if (failCount > MAX_FAILS) return; // let the existing hero fallback take over
    if (el === current.el) {
      // Skip the broken clip: advance immediately without a visible break.
      preloadNext();
      crossfadeToNext();
    } else {
      // The preloaded buffer failed — just try preparing the one after it.
      next.idx = (next.idx + 1) % total;
      loadClip(next.el, next.idx);
    }
  }

  videoA.addEventListener('timeupdate', onTimeUpdate);
  videoB.addEventListener('timeupdate', onTimeUpdate);
  videoA.addEventListener('ended', onEnded);
  videoB.addEventListener('ended', onEnded);
  videoB.addEventListener('error', onError);
  // Note: videoA (#heroVideo) already has its own 'error' listener from the
  // existing hero fallback script, which shows the SVG background. We add
  // our own lightweight handler too so a single missing clip doesn't stall
  // the whole story if the underlying element is still healthy overall.
  videoA.addEventListener('error', onError);

  var started = false;
  function init() {
    if (started) return;
    started = true;

    // The original element autoplays/loops a single background clip; the
    // sequence engine now takes over its content and timing.
    videoA.removeAttribute('loop');
    videoA.style.opacity = '1';
    videoB.style.opacity = '0';

    loadClip(videoA, 0);
    safePlay(videoA);
    announceCycleStart();
    preloadNext();
  }

  // Start as soon as the page is ready for it; a short fallback timer covers
  // browsers/environments where metadata events are delayed or blocked.
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  }
  window.setTimeout(init, 1500);
})();
