document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');

  menuToggle?.addEventListener('click', () => {
    document.body.classList.toggle('menu-open');
  });

  initEditorial();
  initScenes();
});

function initEditorial() {
  const el = document.getElementById('editorial');
  if (!el) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The two-photo-plus-centered-text composition has no room to breathe
  // below ~640px — the plain stacked fallback reads better there.
  const isNarrow = window.innerWidth < 640;
  if (prefersReducedMotion || isNarrow) return;

  const moments = Array.from(el.querySelectorAll('.editorial__moment'));
  const count = moments.length;
  if (count < 1) return;

  el.classList.add('editorial--pinned');
  el.style.setProperty('--moment-count', count);

  const parts = moments.map((moment) => ({
    moment,
    mediaA: moment.querySelector('.editorial__media--a'),
    mediaB: moment.querySelector('.editorial__media--b'),
    text: moment.querySelector('.editorial__text'),
  }));

  // How big/offset each photo starts before settling into its final
  // (CSS-defined) size and position, and how much of the moment's own
  // window the crossfade takes.
  const FADE = 0.6;
  const START_A = { scale: 1.7, x: -8, y: 6 };
  const START_B = { scale: 1.45, x: -16, y: -6 };

  let ticking = false;

  function clamp01(v) {
    return Math.min(Math.max(v, 0), 1);
  }

  // Cubic ease-out, matched to the site's --ease-out curve — used for the
  // big settle motion so it decelerates the same way everything else does.
  function easeOut(t) {
    return 1 - (1 - t) * (1 - t) * (1 - t);
  }

  function update() {
    ticking = false;

    const rect = el.getBoundingClientRect();
    const scrollableHeight = el.offsetHeight - window.innerHeight;
    if (scrollableHeight <= 0) return;

    const progress = clamp01(-rect.top / scrollableHeight);
    const band = progress * count;

    // Fade-in paced to match the photos' settle, so the crossfade and the
    // zoom-out read as one continuous scroll-driven motion instead of a
    // pop. Moment 0 is already on screen at the very top.
    const enter = moments.map((_, i) => (i === 0 ? 1 : clamp01((band - i) / FADE)));

    parts.forEach(({ mediaA, mediaB, text }, i) => {
      const nextEnter = i + 1 < count ? enter[i + 1] : 0;
      const momentOpacity = enter[i] * (1 - nextEnter);
      parts[i].moment.style.opacity = momentOpacity.toFixed(3);

      // Local progress spans the photo's ENTIRE time on screen (not just
      // its entrance), so the zoom keeps drifting the whole way through
      // instead of settling once and going static — a slow, continuous
      // parallax rather than a one-shot entrance effect.
      const t = clamp01(band - i);
      const ease = easeOut(Math.min(t / FADE, 1));
      // A tiny continuous linear drift layered on top of the ease: the
      // ease's motion tapers off near 1, this keeps things faintly alive
      // for the rest of the moment's time on screen.
      const driftA = t * 2.5;
      const driftB = t * 3.5;

      const aScale = START_A.scale + (1 - START_A.scale) * ease;
      const aX = START_A.x * (1 - ease);
      const aY = START_A.y * (1 - ease) - driftA;
      mediaA.style.transform = `translate(${aX.toFixed(2)}%, ${aY.toFixed(2)}%) scale(${aScale.toFixed(3)})`;

      const bScale = START_B.scale + (1 - START_B.scale) * ease;
      const bX = START_B.x * (1 - ease);
      const bY = START_B.y * (1 - ease) + driftB;
      mediaB.style.transform = `translate(${bX.toFixed(2)}%, ${bY.toFixed(2)}%) scale(${bScale.toFixed(3)})`;

      // Photos unveil through a shrinking clip-mask and a fading blur as
      // they settle, rather than appearing already sharp.
      const reveal = ease;
      const clipAmt = (1 - reveal) * 7;
      const blurAmt = (1 - reveal) * 10;
      const mediaFilter = `blur(${blurAmt.toFixed(2)}px)`;
      const mediaClip = `inset(${clipAmt.toFixed(2)}%)`;
      mediaA.style.filter = mediaFilter;
      mediaA.style.clipPath = mediaClip;
      mediaB.style.filter = mediaFilter;
      mediaB.style.clipPath = mediaClip;

      // Text appears once the photos are mostly settled, with its own
      // soft blur-in rather than a plain fade.
      const settle = clamp01((band - i) / FADE);
      const textOpacity = clamp01((settle - 0.55) / 0.35);
      const lift = (1 - textOpacity) * 16;
      const textBlur = (1 - textOpacity) * 6;
      const base = text.classList.contains('editorial__text--center') ? 'translate(-50%, -50%)' : '';
      text.style.opacity = textOpacity.toFixed(3);
      text.style.transform = `${base} translateY(${lift.toFixed(2)}px)`;
      text.style.filter = `blur(${textBlur.toFixed(2)}px)`;
    });
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}

function initScenes() {
  const scenesEl = document.getElementById('scenes');
  if (!scenesEl) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const photos = Array.from(scenesEl.querySelectorAll('.scene-photo'));
  const infos = Array.from(scenesEl.querySelectorAll('.scene-info'));
  const cards = Array.from(scenesEl.querySelectorAll('.scene-card'));
  const ruleFills = Array.from(scenesEl.querySelectorAll('.scene-info__rule-fill'));
  const count = photos.length;
  if (count < 2) return;

  scenesEl.classList.add('scenes--pinned');
  scenesEl.style.setProperty('--scene-count', count);

  // How much of one "band" (0..1) a photo's slide-in takes, vs. just
  // sitting still waiting to be covered by the next one.
  const SLIDE = 0.5;

  photos.forEach((p, i) => (p.style.zIndex = String(i)));
  infos.forEach((el, i) => (el.style.zIndex = String(i)));
  cards.forEach((el, i) => (el.style.zIndex = String(i)));

  let ticking = false;

  function clamp01(v) {
    return Math.min(Math.max(v, 0), 1);
  }

  function update() {
    ticking = false;

    const rect = scenesEl.getBoundingClientRect();
    const scrollableHeight = scenesEl.offsetHeight - window.innerHeight;
    if (scrollableHeight <= 0) return;

    const progress = clamp01(-rect.top / scrollableHeight);
    const band = progress * count;
    // One continuous bar for the whole journey — 25% done after scene 1,
    // 50% after scene 2, and so on. Every scene's rule gets the same
    // value; only the active scene's copy is ever visible, so it reads
    // as one line that never resets.
    const ruleProgress = (band / count).toFixed(3);
    ruleFills.forEach((fill) => {
      fill.style.transform = `scaleX(${ruleProgress})`;
    });

    // Scene 0 is the base layer, already in place from the start.
    // Scenes 1+ slide up from below to cover whatever came before.
    const slideIn = photos.map((_, i) => (i === 0 ? 1 : clamp01((band - i) / SLIDE)));

    for (let i = 0; i < count; i += 1) {
      photos[i].style.transform = `translateY(${((1 - slideIn[i]) * 100).toFixed(2)}%)`;

      // Text opacity = how far THIS photo has slid in, times how far the
      // NEXT photo hasn't yet. The two always sum to 1 at a handoff, so
      // one scene's copy fades out exactly as the next fades in — no gap
      // where nothing is visible, no long double-exposure overlap either.
      const nextSlideIn = i + 1 < count ? slideIn[i + 1] : 0;
      const opacity = slideIn[i] * (1 - nextSlideIn);

      infos[i].style.opacity = opacity.toFixed(3);
      if (cards[i]) cards[i].style.opacity = opacity.toFixed(3);
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}
