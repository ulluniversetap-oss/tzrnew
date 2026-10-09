document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');

  menuToggle?.addEventListener('click', () => {
    document.body.classList.toggle('menu-open');
  });

  initScenes();
});

function initScenes() {
  const scenesEl = document.getElementById('scenes');
  if (!scenesEl) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const photos = Array.from(scenesEl.querySelectorAll('.scene-photo'));
  const infos = Array.from(scenesEl.querySelectorAll('.scene-info'));
  const cards = Array.from(scenesEl.querySelectorAll('.scene-card'));
  const ruleFill = scenesEl.querySelector('.scenes__rule-fill');
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

    if (ruleFill) {
      // One continuous bar for the whole journey — 25% done after scene 1,
      // 50% after scene 2, and so on. Never resets, never moves.
      ruleFill.style.transform = `scaleX(${(band / count).toFixed(3)})`;
    }

    for (let i = 0; i < count; i += 1) {
      // Scene 0 is the base layer, already in place from the start.
      // Scenes 1+ slide up from below to cover whatever came before.
      const slideIn = i === 0 ? 1 : clamp01((band - i) / SLIDE);
      photos[i].style.transform = `translateY(${((1 - slideIn) * 100).toFixed(2)}%)`;

      // Text only appears once its photo has mostly slid into place, and
      // fades out quickly right as the next photo starts covering it.
      const fadeInStart = i === 0 ? -1 : i + SLIDE * 0.6;
      const fadeInEnd = i === 0 ? 0 : i + SLIDE;
      const fadeOutStart = i + 1 - 0.1;
      const fadeOutEnd = i + 1;

      let opacity;
      if (band <= fadeInStart) opacity = 0;
      else if (band < fadeInEnd) opacity = (band - fadeInStart) / (fadeInEnd - fadeInStart);
      else if (i === count - 1 || band <= fadeOutStart) opacity = 1;
      else if (band < fadeOutEnd) opacity = 1 - (band - fadeOutStart) / (fadeOutEnd - fadeOutStart);
      else opacity = 0;

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
