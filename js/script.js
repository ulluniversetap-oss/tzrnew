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

  // No pinning, no scroll math: the photos just scroll past at native
  // speed inside a tall relative box, and the caption is position:sticky
  // in CSS. The only JS here is a plain fade-up as each piece enters
  // view — everything else is the browser's own scrolling.
  const targets = Array.from(el.querySelectorAll('.editorial__media, .editorial__text'));
  if (!targets.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach((t) => t.classList.add('is-visible'));
    return;
  }

  el.classList.add('editorial--observed');

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
  );

  targets.forEach((t) => io.observe(t));
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
