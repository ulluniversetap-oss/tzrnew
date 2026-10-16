/* ============================================================
   CONFIG — every tunable number lives here.
   ============================================================ */
const CONFIG = {
  lenis: {
    duration: 1.2,
    smoothWheel: true,
    // expo-out
    easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  },

  scrub: 0.6,

  hero: {
    imgScaleFrom: 1.08,
    imgScaleTo: 1,
    introImgScaleDuration: 1.6,
    introWordDuration: 1.2,
    introCaptionDelay: 0.4,
    introIntroDelay: 0.4,
    exitImgYPercent: -15,
    exitWordYPercent: -40,
  },

  duo: {
    aFromYPercent: 40,
    aToYPercent: -140,
    bSpeedMultiplier: 1.3,
    textFadeStart: 0.66, // fraction of the section's scroll where text starts leaving
    textFadeEnd: 1.0,
    textBlur: 6,
    textY: -20,
  },

  split: {
    maskScaleFrom: 1.15,
    maskScaleTo: 1,
    textStartY: '30vh',
    detailStartY: '55vh',
    detailEndY: '-45vh',
    pinDwellVh: 60,
    pinTextShiftY: '-9vh',
    exitShiftYPercent: -10,
  },

  residences: {
    wordRevealStart: 'top 80%',
    captionDelay: 0.3,
    imgScaleFrom: 1.12,
    imgScaleTo: 1,
  },

  responsive: {
    mobileParallaxMultiplier: 0.5,
    mobileBreakpoint: 768,
  },
};

/* ============================================================
   SETUP
   ============================================================ */
gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.innerWidth <= CONFIG.responsive.mobileBreakpoint;
const pm = isMobile ? CONFIG.responsive.mobileParallaxMultiplier : 1;

let lenis = null;

if (!prefersReducedMotion) {
  lenis = new Lenis({
    duration: CONFIG.lenis.duration,
    easing: CONFIG.lenis.easing,
    smoothWheel: CONFIG.lenis.smoothWheel,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ============================================================
   HEADER THEME + SCROLL INDICATOR
   ============================================================ */
const headerEl = document.querySelector('.header');
const thumbEl = document.querySelector('.scroll-indicator__thumb');

function setHeaderTheme(theme) {
  headerEl.dataset.theme = theme;
}

document.querySelectorAll('.screen').forEach((screen) => {
  const theme = screen.dataset.theme;
  ScrollTrigger.create({
    trigger: screen,
    start: 'top top',
    end: 'bottom top',
    onEnter: () => setHeaderTheme(theme),
    onEnterBack: () => setHeaderTheme(theme),
  });
});

ScrollTrigger.create({
  trigger: document.body,
  start: 'top top',
  end: 'bottom bottom',
  onUpdate: (self) => {
    const track = document.querySelector('.scroll-indicator__track').getBoundingClientRect();
    const travel = track.height - 14;
    gsap.set(thumbEl, { y: self.progress * travel });
  },
});

/* ============================================================
   SCREEN 1 — HERO
   ============================================================ */
(() => {
  const section = document.querySelector('.screen--1');
  const img = section.querySelector('.hero__img');
  const media = section.querySelector('.hero__media');
  // wordShift carries the exit parallax; wordWrap (its parent) stays
  // pure-CSS (translateY(-50%) for centering) so the two never fight
  // over the same transform — see the note on .hero__word-shift in CSS.
  const wordShift = section.querySelector('.hero__word-shift');
  const word = section.querySelector('.hero__word');
  const caption = section.querySelector('.hero__caption');
  const intro = section.querySelector('.hero__intro');

  gsap.set(img, { scale: CONFIG.hero.imgScaleFrom });
  gsap.set(word, { yPercent: 100 });

  if (prefersReducedMotion) {
    gsap.set(img, { scale: CONFIG.hero.imgScaleTo });
    gsap.set(word, { yPercent: 0 });
    gsap.set([caption, intro], { opacity: 1 });
  } else {
    // One-time entrance, plays on load — not scroll-scrubbed.
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to(img, { scale: CONFIG.hero.imgScaleTo, duration: CONFIG.hero.introImgScaleDuration }, 0)
      .to(word, { yPercent: 0, duration: CONFIG.hero.introWordDuration, ease: 'power4.out' }, 0)
      .to(caption, { opacity: 1, duration: 0.8 }, CONFIG.hero.introCaptionDelay)
      .to(intro, { opacity: 1, duration: 0.8 }, CONFIG.hero.introIntroDelay);
  }

  // Scroll-tied exit parallax while screen 2 shutters over the pinned hero.
  gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      scrub: CONFIG.scrub,
    },
  })
    .to(media, { yPercent: CONFIG.hero.exitImgYPercent * pm, ease: 'none' }, 0)
    .to(wordShift, { yPercent: CONFIG.hero.exitWordYPercent * pm, opacity: 0, ease: 'none' }, 0);
})();

/* ============================================================
   SCREEN 2 — PARALLAX DUO
   ============================================================ */
(() => {
  const section = document.querySelector('.screen--2');
  const text = section.querySelector('.duo__text');
  const mediaA = section.querySelector('.duo__media--a');
  const mediaB = section.querySelector('.duo__media--b');

  const aFrom = CONFIG.duo.aFromYPercent * pm;
  const aTo = CONFIG.duo.aToYPercent * pm;
  const aDelta = aTo - aFrom;
  const bFrom = aFrom;
  const bTo = bFrom + aDelta * CONFIG.duo.bSpeedMultiplier;

  gsap.set(text, { xPercent: -50, yPercent: -50 });
  gsap.set(mediaA, { yPercent: aFrom });
  gsap.set(mediaB, { yPercent: bFrom });

  if (prefersReducedMotion) {
    gsap.set(mediaA, { yPercent: aTo });
    gsap.set(mediaB, { yPercent: bTo });
    gsap.set(text, { opacity: 0 });
    return;
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      scrub: CONFIG.scrub,
    },
  });

  tl.to(mediaA, { yPercent: aTo, ease: 'none', duration: 1 }, 0)
    .to(mediaB, { yPercent: bTo, ease: 'none', duration: 1 }, 0)
    .fromTo(
      text,
      { opacity: 1, filter: 'blur(0px)', y: 0 },
      {
        opacity: 0,
        filter: `blur(${CONFIG.duo.textBlur}px)`,
        y: CONFIG.duo.textY,
        ease: 'none',
        duration: CONFIG.duo.textFadeEnd - CONFIG.duo.textFadeStart,
      },
      CONFIG.duo.textFadeStart
    );
})();

/* ============================================================
   SCREEN 3 — SPLIT
   ============================================================ */
(() => {
  const section = document.querySelector('.screen--3');
  const shift = section.querySelector('.split__shift');
  const textWrap = section.querySelector('.split__text-wrap');
  const mediaMask = section.querySelector('.split__media-mask');
  const mediaImg = mediaMask.querySelector('img');
  const detail = section.querySelector('.split__detail');

  gsap.set(textWrap, { yPercent: -50, y: CONFIG.split.textStartY });
  gsap.set(mediaMask, { yPercent: 100 });
  gsap.set(mediaImg, { scale: CONFIG.split.maskScaleFrom });
  gsap.set(detail, { yPercent: -50, y: CONFIG.split.detailStartY });

  if (prefersReducedMotion) {
    gsap.set(textWrap, { y: 0 });
    gsap.set(mediaMask, { yPercent: 0 });
    gsap.set(mediaImg, { scale: CONFIG.split.maskScaleTo });
    gsap.set(detail, { y: CONFIG.split.detailEndY });
    return;
  }

  // A single unified timeline covers entrance -> pin dwell -> exit.
  // (Three independent ScrollTriggers touching the same properties on the
  // same elements fight each other: each one renders its own "from" state
  // on every update regardless of whether it's the active phase, and
  // whichever was created last wins that frame. One timeline with the
  // phases laid out as fractions of its own span avoids that entirely.)
  const vh = window.innerHeight;
  const sectionHeight = section.offsetHeight;
  const dwellPx = vh * (CONFIG.split.pinDwellVh / 100);
  const totalPx = vh + sectionHeight; // 'top bottom' -> 'bottom top'

  const entranceFrac = vh / totalPx;
  const dwellFrac = dwellPx / totalPx;
  const dwellEndFrac = entranceFrac + dwellFrac;
  const exitStartFrac = sectionHeight / totalPx;

  gsap
    .timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: CONFIG.scrub,
      },
    })
    .fromTo(mediaMask, { yPercent: 100 }, { yPercent: 0, ease: 'none', duration: entranceFrac }, 0)
    .fromTo(mediaImg, { scale: CONFIG.split.maskScaleFrom }, { scale: CONFIG.split.maskScaleTo, ease: 'none', duration: entranceFrac }, 0)
    .fromTo(textWrap, { y: CONFIG.split.textStartY }, { y: 0, ease: 'none', duration: entranceFrac }, 0)
    .fromTo(detail, { y: CONFIG.split.detailStartY }, { y: CONFIG.split.detailEndY, ease: 'none', duration: entranceFrac }, 0)
    .to(textWrap, { y: CONFIG.split.pinTextShiftY, ease: 'none', duration: dwellEndFrac - entranceFrac }, entranceFrac)
    // Exit lives entirely on the .split__shift wrapper — a fresh element
    // no other tween in this timeline touches — so there's no property
    // to fight over and no relative-value ambiguity.
    .to(shift, { yPercent: CONFIG.split.exitShiftYPercent * pm, ease: 'none', duration: 1 - exitStartFrac }, exitStartFrac);
})();

/* ============================================================
   SCREEN 4 — RESIDENCES
   ============================================================ */
(() => {
  const prevSection = document.querySelector('.screen--3');
  const section = document.querySelector('.screen--4');
  const img = section.querySelector('.res__img');
  const word = section.querySelector('.res__word');
  const caption = section.querySelector('.res__caption');

  gsap.set(img, { scale: CONFIG.residences.imgScaleFrom });
  gsap.set(word, { yPercent: 100 });

  if (prefersReducedMotion) {
    gsap.set(img, { scale: CONFIG.residences.imgScaleTo });
    gsap.set(word, { yPercent: 0 });
    gsap.set(caption, { opacity: 1 });
    return;
  }

  // Scale tied to the same scroll range as screen 3's exit (screen 4 rising into view).
  gsap.timeline({
    scrollTrigger: {
      trigger: prevSection,
      start: 'bottom bottom',
      end: 'bottom top',
      scrub: CONFIG.scrub,
    },
  }).fromTo(
    img,
    { scale: CONFIG.residences.imgScaleFrom },
    { scale: CONFIG.residences.imgScaleTo, ease: 'none' },
    0
  );

  // One-time word reveal, not scrubbed.
  ScrollTrigger.create({
    trigger: section,
    start: CONFIG.residences.wordRevealStart,
    once: true,
    onEnter: () => {
      gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        .to(word, { yPercent: 0, duration: 1.2 }, 0)
        .to(caption, { opacity: 1, duration: 0.8, ease: 'power2.out' }, CONFIG.residences.captionDelay);
    },
  });
})();
