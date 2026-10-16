/* ============================================================
   CONFIG — every tunable number lives here.
   ============================================================ */
const CONFIG = {
  lenis: {
    duration: 1.2,
    smoothWheel: true,
    easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)), // expo-out
  },

  scrub: 0.6,

  header: {
    wordmarkFadeDistance: 120, // px of body scroll over which "Springs" disappears
  },

  cursor: {
    lerp: 0.18,
  },

  hero: {
    collageRotate: -24,
    collageBaseScale: 1.4,
    collageIntroScaleMultiplier: 1.12, // starts at baseScale * this, settles to baseScale
    collageIntroDuration: 1.8,
    tileStagger: 0.06,
    titleLineDuration: 1.0,
    titleStagger: 0.12,
    introDelay: 0.5,
    idleDriftPx: 12,
    idleDriftDuration: 14,
    mouseParallaxPx: 10,
    exitCollageYPercent: -12,
    exitTitleYPercent: -50,
  },

  // SCREEN 2 is one continuous pinned sequence (Premium Living -> Open
  // the Doors): the photo stack behind everything never disappears or
  // hands off to a new section, it just crossfades between three images,
  // while a single panel grows once on the left and hosts two copy
  // blocks in turn. All fractions below are positions (0-1) within that
  // one sequence's own scrubbed timeline.
  combo: {
    livingTitleFadeEnd: 0.08, // "Premium Living" copy is gone by here
    panelStart: 0.04,
    panelEnd: 0.14,
    imgScaleFrom: 1.08,
    imgScaleTo: 1,

    slide2Start: 0.14, // tower-sunset -> balconies
    slide2End: 0.24,
    slide3Start: 0.46, // balconies -> tower-elevation
    slide3End: 0.56,
    slideScaleFrom: 1.08,

    doorsFadeStart: 0.12, // "Open the doors" copy fades in while slide2 is still crossfading
    doorsFadeEnd: 0.2,

    // The doors copy then just sits still, fully readable, for a long
    // hold — parallax only kicks in afterwards, close to the end of the
    // sequence, so there's plenty of untouched scroll distance to read
    // the paragraph before anything starts drifting away.
    parallaxStart: 0.8,

    // Differential parallax for the doors copy, applied from parallaxStart
    // to the end, so the square visibly slides under the title and exits
    // first, per the reference.
    titleYRange: -40,
    squareYRange: -260,
    textYRange: -60,
  },

  wellness: {
    wordRevealStart: 'top 85%',
    textDelay: 0.25,
    imgScaleFrom: 1.12,
    imgScaleTo: 1,
  },

  // SCREEN 5 — Spa / Yoga / Fitness / Café. Entirely data-driven: adding a
  // 5th item only means adding a 5th entry here (the section's own height
  // is computed from items.length at runtime, matching the spec's
  // "100vh * (n + 1)" formula).
  features: {
    items: [
      {
        key: 'spa',
        title: 'Spa',
        img: 'assets/feature-spa.webp',
        text: "Let your thoughts flow freely as you immerse yourself in our crystal-clear spa pool that offers a view of the garden. Soft glare on the water, a cup of herbal tea in the fragrant warmth of the hammam — and just like that, you leave the day's worries behind.",
      },
      {
        key: 'yoga',
        title: 'Yoga',
        img: 'assets/feature-yoga.webp',
        text: 'Relaxing yoga session mellows the mind and makes your body feel light and responsive. Finding balance is easy.',
      },
      {
        key: 'fitness',
        title: 'Fitness',
        img: 'assets/feature-fitness.webp',
        text: "Get ready to face the day guided by your personal trainer in our modern fitness center. Exercise at your convenience, because the gym is just a few steps away — right up the stairs.",
      },
      {
        key: 'cafe',
        title: 'Café',
        img: 'assets/feature-cafe.webp',
        text: 'Do you sense the aroma of espresso adorned with creamy milk foam? Now you can experience your favorite flavors without leaving the house. Cozy up on the terrace of our wellness-café and relax to the sounds of ambient music.',
      },
    ],

    // Each step gets an equal share of the section's true-pinned scroll
    // range; within a step, the first `transitionFraction` is the
    // crossfade and the rest is a held, readable resting state.
    transitionFraction: 0.35,

    photoParallaxPercent: -8, // the outgoing photo drifts up this much while the incoming one wipes over it
    slideScaleFrom: 1.12,

    textBlur: 4,
    textOutY: -14,
    textInY: 16,

    // Entrance from Wellness: two shutters closing from opposite edges.
    entrance: {
      wellnessExitYPercent: -8,
      wellnessDarkenOpacity: 0.25,
      listFadeDelay: 0, // relative to the entrance finishing
    },

    snap: { duration: 0.5, ease: 'power2.inOut', delay: 0.1 },

    cursorGrowPx: 10,
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

// A sticky element only stays pinned at top:0 while its tall wrapper still
// has (wrapperHeight - viewportHeight) of scroll left to give — for the
// final viewportHeight of the wrapper, position:sticky itself starts
// sliding the content away so it never overflows the wrapper's own
// bottom edge. A ScrollTrigger range of 'top top' -> 'bottom top' (the
// wrapper's full height) therefore overshoots the truly-pinned window by
// one viewport: anything scrubbed to finish at progress 1 is still mid-
// animation when sticky starts releasing early, which reads as a glitchy,
// disconnected cut into the next section. Ending the range at the true
// release point keeps every scrubbed animation fully settled exactly when
// release begins, so the sticky slide-away itself becomes the shutter.
function stickyEnd(section) {
  return () => '+=' + (section.offsetHeight - window.innerHeight);
}

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
   CUSTOM CURSOR
   ============================================================ */
(() => {
  const cursor = document.querySelector('.cursor');
  if (!cursor || isMobile) return;

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let cx = mx;
  let cy = my;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

  gsap.ticker.add(() => {
    cx += (mx - cx) * CONFIG.cursor.lerp;
    cy += (my - cy) * CONFIG.cursor.lerp;
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
  });
})();

/* ============================================================
   HEADER — "Springs" wordmark fade
   ============================================================ */
(() => {
  const wordmark = document.querySelector('.header__wordmark');

  if (prefersReducedMotion) {
    wordmark.style.opacity = '0';
    return;
  }

  gsap.set(wordmark, { opacity: 1, clipPath: 'inset(0 0% 0 0)' });

  gsap.timeline({
    scrollTrigger: {
      trigger: document.body,
      start: 'top top',
      end: `+=${CONFIG.header.wordmarkFadeDistance}`,
      scrub: true,
    },
  }).to(wordmark, { opacity: 0, clipPath: 'inset(0 100% 0 0)', ease: 'none' }, 0);
})();

/* ============================================================
   SCROLL INDICATOR
   ============================================================ */
const thumbEl = document.querySelector('.scroll-indicator__thumb');
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
  const collageWrap = section.querySelector('.hero__collage-wrap');
  const collage = section.querySelector('.hero__collage');
  const tiles = section.querySelectorAll('.tile');
  const intro = section.querySelector('.hero__intro');
  const titleLines = section.querySelectorAll('.hero__title-line');
  const arrow = section.querySelector('.hero__arrow');

  const introScale = CONFIG.hero.collageBaseScale * CONFIG.hero.collageIntroScaleMultiplier;

  gsap.set(collage, { rotate: CONFIG.hero.collageRotate, scale: introScale });
  gsap.set(tiles, { opacity: 0 });
  gsap.set(titleLines, { yPercent: 100 });
  gsap.set([intro, arrow], { opacity: 0 });

  if (prefersReducedMotion) {
    gsap.set(collage, { scale: CONFIG.hero.collageBaseScale });
    gsap.set(tiles, { opacity: 1 });
    gsap.set(titleLines, { yPercent: 0 });
    gsap.set([intro, arrow], { opacity: 1 });
  } else {
    // One-time entrance.
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to(collage, { scale: CONFIG.hero.collageBaseScale, duration: CONFIG.hero.collageIntroDuration }, 0)
      .to(tiles, { opacity: 1, duration: 0.8, stagger: CONFIG.hero.tileStagger }, 0.1)
      .to(titleLines, { yPercent: 0, duration: CONFIG.hero.titleLineDuration, ease: 'power4.out', stagger: CONFIG.hero.titleStagger }, 0.3)
      .to([intro, arrow], { opacity: 1, duration: 0.8 }, CONFIG.hero.introDelay);

    // Idle diagonal drift.
    gsap.to(collage, {
      x: `+=${CONFIG.hero.idleDriftPx}`,
      y: `+=${CONFIG.hero.idleDriftPx}`,
      duration: CONFIG.hero.idleDriftDuration,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: CONFIG.hero.collageIntroDuration,
    });

    // Mouse parallax (subtle) — a second, independent translate on the
    // same wrap as the idle drift; GSAP tweens on different target props
    // (x/y here vs the scroll-exit's yPercent below) compose fine.
    if (!isMobile) {
      window.addEventListener('mousemove', (e) => {
        const px = (e.clientX / window.innerWidth - 0.5) * 2 * CONFIG.hero.mouseParallaxPx;
        const py = (e.clientY / window.innerHeight - 0.5) * 2 * CONFIG.hero.mouseParallaxPx;
        gsap.to(collageWrap, { x: px, y: py, duration: 0.8, ease: 'power2.out' });
      });
    }
  }

  // Scroll-tied exit while screen 2 shutters over the pinned hero.
  gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: stickyEnd(section),
      scrub: CONFIG.scrub,
    },
  })
    .to(collageWrap, { yPercent: CONFIG.hero.exitCollageYPercent * pm, ease: 'none' }, 0)
    .to([intro, '.hero__title-wrap', arrow], { yPercent: CONFIG.hero.exitTitleYPercent * pm, opacity: 0, ease: 'none' }, 0);
})();

/* ============================================================
   SCREEN 2 — PREMIUM LIVING -> OPEN THE DOORS (one sequence)
   ============================================================ */
(() => {
  const section = document.querySelector('.screen--2');
  const c = CONFIG.combo;

  const slide1Img = section.querySelector('.combo__slide--1 img');
  const slide2 = section.querySelector('.combo__slide--2');
  const slide2Img = slide2.querySelector('img');
  const slide3 = section.querySelector('.combo__slide--3');
  const slide3Img = slide3.querySelector('img');
  const panel = section.querySelector('.combo__panel');

  const livingTitle = section.querySelector('.living__title');
  const livingCaption = section.querySelector('.living__caption');
  const doorsBlock = section.querySelector('.combo__doors');
  const doorsTitle = section.querySelector('.doors__title');
  const doorsSquare = section.querySelector('.doors__square');
  const doorsText = section.querySelector('.doors__text');

  gsap.set(panel, { xPercent: -100 });
  gsap.set(slide1Img, { scale: c.imgScaleFrom });
  gsap.set(slide2, { yPercent: 100 });
  gsap.set(slide2Img, { scale: c.slideScaleFrom });
  gsap.set(slide3, { yPercent: 100 });
  gsap.set(slide3Img, { scale: c.slideScaleFrom });
  gsap.set(doorsBlock, { opacity: 0 });

  if (prefersReducedMotion) {
    gsap.set(panel, { xPercent: 0 });
    gsap.set(slide1Img, { scale: c.imgScaleTo });
    gsap.set([livingTitle, livingCaption], { opacity: 0 });
    gsap.set(slide2, { yPercent: 100 });
    gsap.set(slide3, { yPercent: 0 });
    gsap.set(slide3Img, { scale: 1 });
    gsap.set(doorsBlock, { opacity: 1 });
    return;
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: stickyEnd(section),
      scrub: CONFIG.scrub,
    },
  });

  tl
    // "Premium Living" copy fades early; background photo settles to scale 1.
    .to([livingTitle, livingCaption], { opacity: 0, ease: 'none', duration: c.livingTitleFadeEnd }, 0)
    .to(slide1Img, { scale: c.imgScaleTo, ease: 'none', duration: c.panelEnd }, 0)
    // Panel grows once — a plain opaque overlay, the photo behind it never moves.
    .to(panel, { xPercent: 0, ease: 'none', duration: c.panelEnd - c.panelStart }, c.panelStart)
    // Photo crossfades, confined visually to the right half by the panel on top.
    .to(slide2, { yPercent: 0, ease: 'none', duration: c.slide2End - c.slide2Start }, c.slide2Start)
    .to(slide2Img, { scale: 1, ease: 'none', duration: c.slide2End - c.slide2Start }, c.slide2Start)
    .to(slide3, { yPercent: 0, ease: 'none', duration: c.slide3End - c.slide3Start }, c.slide3Start)
    .to(slide3Img, { scale: 1, ease: 'none', duration: c.slide3End - c.slide3Start }, c.slide3Start)
    // "Open the doors" copy fades in while the first crossfade is still playing,
    // then just holds there untouched until parallaxStart — plenty of scroll
    // distance to actually read it before anything moves.
    .to(doorsBlock, { opacity: 1, ease: 'none', duration: c.doorsFadeEnd - c.doorsFadeStart }, c.doorsFadeStart)
    // Differential parallax, only in the final stretch: the square outpaces
    // the title and text, sliding under them and exiting first.
    .to(doorsTitle, { y: c.titleYRange * pm, ease: 'none', duration: 1 - c.parallaxStart }, c.parallaxStart)
    .to(doorsSquare, { y: c.squareYRange * pm, ease: 'none', duration: 1 - c.parallaxStart }, c.parallaxStart)
    .to(doorsText, { y: c.textYRange * pm, ease: 'none', duration: 1 - c.parallaxStart }, c.parallaxStart);
})();

/* ============================================================
   SCREEN 4 — WELLNESS
   ============================================================ */
(() => {
  const prevSection = document.querySelector('.screen--2');
  const section = document.querySelector('.screen--4');
  const img = section.querySelector('.well__img');
  const text = section.querySelector('.well__text');
  const word = section.querySelector('.well__word');
  const caption = section.querySelector('.well__caption');

  gsap.set(img, { scale: CONFIG.wellness.imgScaleFrom });
  gsap.set(word, { yPercent: 100 });
  gsap.set(text, { y: 20 });

  if (prefersReducedMotion) {
    gsap.set(img, { scale: CONFIG.wellness.imgScaleTo });
    gsap.set(word, { yPercent: 0 });
    gsap.set(text, { y: 0, opacity: 1 });
    gsap.set(caption, { opacity: 1 });
    return;
  }

  // Scale tied to screen 3's exit range (screen 4 rising into view).
  gsap.timeline({
    scrollTrigger: {
      trigger: prevSection,
      start: 'bottom bottom',
      end: 'bottom top',
      scrub: CONFIG.scrub,
    },
  }).fromTo(img, { scale: CONFIG.wellness.imgScaleFrom }, { scale: CONFIG.wellness.imgScaleTo, ease: 'none' }, 0);

  // One-time reveal, not scrubbed.
  ScrollTrigger.create({
    trigger: section,
    start: CONFIG.wellness.wordRevealStart,
    once: true,
    onEnter: () => {
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .to(word, { yPercent: 0, duration: 1.1 }, 0)
        .to(text, { y: 0, opacity: 1, duration: 0.9 }, CONFIG.wellness.textDelay)
        .to(caption, { opacity: 1, duration: 0.8 }, CONFIG.wellness.textDelay);
    },
  });
})();

/* ============================================================
   SCREEN 5 — FEATURES (Spa / Yoga / Fitness / Café)
   ============================================================ */
(() => {
  const f = CONFIG.features;
  const items = f.items;
  const n = items.length;

  const wellnessSection = document.querySelector('.screen--4');
  const wellnessMedia = wellnessSection.querySelector('.well__media');
  const wellnessDarken = wellnessSection.querySelector('.well__darken');

  const section = document.querySelector('.features');
  const photoCol = section.querySelector('.features__photo-col');
  const panelCol = section.querySelector('.features__panel-col');
  const photosWrap = section.querySelector('.features__photos');
  const listEl = section.querySelector('.features__list');
  const copyEl = section.querySelector('.features__copy');

  // The section's own height is 100vh * (n + 1) per spec — computed here
  // so CONFIG.features.items is the one place to touch to add a step.
  section.style.height = `${(n + 1) * 100}vh`;

  // --- Build the DOM for each item -------------------------------------
  const slides = items.map((item, i) => {
    const slide = document.createElement('div');
    slide.className = 'features__slide';
    slide.dataset.index = i;
    const img = document.createElement('img');
    img.src = item.img;
    img.alt = '';
    img.decoding = 'async';
    slide.appendChild(img);
    photosWrap.appendChild(slide);
    return { el: slide, img };
  });

  const listItems = items.map((item, i) => {
    const li = document.createElement('li');
    li.className = 'features__item' + (i === 0 ? ' features__item--active' : '');
    li.dataset.index = i;
    li.textContent = item.title;
    listEl.appendChild(li);
    return li;
  });

  const textEls = items.map((item, i) => {
    const p = document.createElement('p');
    p.className = 'features__text' + (i === 0 ? ' features__text--active' : '');
    p.dataset.index = i;
    p.textContent = item.text;
    copyEl.appendChild(p);
    return p;
  });

  function setActiveItem(i) {
    listItems.forEach((li, idx) => li.classList.toggle('features__item--active', idx === i));
  }

  // --- Click-to-jump: scroll to the point where step i is settled -------
  function stepSettledProgress(i) {
    if (i === 0) return 0;
    return i / n + f.transitionFraction * (1 / n);
  }

  function scrollToStep(i) {
    const start = section.offsetTop;
    const stable = section.offsetHeight - window.innerHeight;
    const y = start + stepSettledProgress(i) * stable;
    if (lenis) lenis.scrollTo(y, { duration: CONFIG.lenis.duration });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  }

  listItems.forEach((li, i) => {
    li.addEventListener('click', () => scrollToStep(i));
  });

  // --- Custom cursor: a plain growing dot while anywhere over this block -
  if (!isMobile) {
    const dot = document.querySelector('.cursor__dot');
    const sticky = section.querySelector('.screen__sticky');
    sticky.addEventListener('mouseenter', () => dot.classList.add('cursor__dot--list'));
    sticky.addEventListener('mouseleave', () => dot.classList.remove('cursor__dot--list', 'cursor__dot--grow'));
    listItems.forEach((li) => {
      li.addEventListener('mouseenter', () => dot.classList.add('cursor__dot--grow'));
      li.addEventListener('mouseleave', () => dot.classList.remove('cursor__dot--grow'));
    });
  }

  // --- Reduced motion: first item shown, everything else static ---------
  if (prefersReducedMotion) {
    gsap.set(slides[0].el, { clipPath: 'inset(0% 0% 0% 0%)' });
    slides.slice(1).forEach((s) => gsap.set(s.el, { clipPath: 'inset(100% 0% 0% 0%)' }));
    gsap.set(listEl, { opacity: 1 });
    gsap.set(textEls[0], { opacity: 1 });
    gsap.set(photoCol, { yPercent: 0 });
    gsap.set(panelCol, { yPercent: 0 });

    listItems.forEach((li, i) => {
      li.addEventListener('click', () => {
        setActiveItem(i);
        textEls.forEach((p, idx) => gsap.set(p, { opacity: idx === i ? 1 : 0 }));
      });
    });
    return;
  }

  // --- Initial states -----------------------------------------------------
  gsap.set(photoCol, { yPercent: 100 });
  gsap.set(panelCol, { yPercent: -100 });
  gsap.set(listEl, { opacity: 0 });
  gsap.set(copyEl, { opacity: 1 }); // the wrapper itself; individual <p> fade via their own opacity
  slides.forEach((s, i) => {
    gsap.set(s.el, { clipPath: i === 0 ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)' });
    gsap.set(s.img, { scale: i === 0 ? 1 : f.slideScaleFrom });
  });
  textEls.forEach((p, i) => gsap.set(p, { opacity: i === 0 ? 1 : 0 }));

  // --- Entrance: two shutters converging, tied to Wellness's own release -
  gsap
    .timeline({
      scrollTrigger: {
        trigger: wellnessSection,
        start: 'bottom bottom',
        end: 'bottom top',
        scrub: CONFIG.scrub,
      },
    })
    .to(wellnessMedia, { yPercent: f.entrance.wellnessExitYPercent, ease: 'none' }, 0)
    .to(wellnessDarken, { opacity: f.entrance.wellnessDarkenOpacity, ease: 'none' }, 0)
    .to(photoCol, { yPercent: 0, ease: 'none' }, 0)
    .to(panelCol, { yPercent: 0, ease: 'none' }, 0);

  // List fades in once the shutters have fully closed. (The first
  // paragraph is deliberately NOT re-animated here: it's already opacity 1
  // from the initial gsap.set above, and the main scrub timeline below is
  // the only thing allowed to ever change it again — giving it a second,
  // independent, real-time tween here would race the scrub for the same
  // property and whichever last happened to render would win.)
  ScrollTrigger.create({
    trigger: wellnessSection,
    start: 'bottom top',
    once: true,
    onEnter: () => {
      gsap.to(listEl, { opacity: 1, duration: 0.6, ease: 'power2.out', delay: f.entrance.listFadeDelay });
    },
  });

  // --- Main sequence: n equal steps, each transitionFraction + hold ------
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: stickyEnd(section),
      scrub: CONFIG.scrub,
      snap: {
        snapTo: items.map((_, i) => stepSettledProgress(i)).concat(1),
        duration: f.snap.duration,
        ease: f.snap.ease,
        delay: f.snap.delay,
      },
      onUpdate: (self) => {
        // Active item flips at the midpoint of each transition, not at
        // the step's hard boundary — matches "switches mid-transition".
        let active = 0;
        for (let i = 1; i < n; i += 1) {
          const mid = i / n + (f.transitionFraction * (1 / n)) / 2;
          if (self.progress >= mid) active = i;
        }
        setActiveItem(active);
      },
    },
  });

  for (let i = 1; i < n; i += 1) {
    const stepStart = i / n;
    const transEnd = stepStart + f.transitionFraction * (1 / n);
    const outgoing = slides[i - 1];
    const incoming = slides[i];
    const outText = textEls[i - 1];
    const inText = textEls[i];

    tl.to(outgoing.el, { yPercent: f.photoParallaxPercent, ease: 'none', duration: transEnd - stepStart }, stepStart)
      .to(incoming.el, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', duration: transEnd - stepStart }, stepStart)
      .to(incoming.img, { scale: 1, ease: 'none', duration: transEnd - stepStart }, stepStart)
      // Outgoing text leaves in the first half of the transition, incoming arrives in the second half.
      .to(outText, { opacity: 0, y: f.textOutY, filter: `blur(${f.textBlur}px)`, ease: 'none', duration: (transEnd - stepStart) / 2 }, stepStart)
      .fromTo(
        inText,
        { opacity: 0, y: f.textInY, filter: 'blur(0px)' },
        { opacity: 1, y: 0, ease: 'none', duration: (transEnd - stepStart) / 2 },
        stepStart + (transEnd - stepStart) / 2
      );
  }

  // Anchor the timeline's total duration to exactly 1: the loop above only
  // ever positions tweens up to the last transition's end (< 1, since the
  // final hold has nothing animating in it), so without this GSAP sizes
  // the timeline to that last tween and the scrub's progress->time mapping
  // drifts — every step before it ends up in the wrong place. A no-op
  // tween pinned at time=1 forces the correct length with no visible effect.
  tl.to(slides[n - 1].el, { duration: 0 }, 1);
})();
