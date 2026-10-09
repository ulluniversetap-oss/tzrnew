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

  const scenes = Array.from(scenesEl.querySelectorAll('.scene'));
  const count = scenes.length;
  if (count < 2) return;

  scenesEl.classList.add('scenes--pinned');
  scenesEl.style.setProperty('--scene-count', count);

  const sceneParts = scenes.map((scene) => ({
    scene,
    media: scene.querySelector('.scene__media'),
    overlay: scene.querySelector('.scene__overlay'),
    content: scene.querySelector('.scene__content'),
    card: scene.querySelector('.scene__card'),
    ruleFill: scene.querySelector('.scene__rule-fill'),
  }));

  let ticking = false;

  function trapezoid(band, index, plateau, edge) {
    const dist = Math.abs(band - index);
    if (dist <= plateau) return 1;
    if (dist >= edge) return 0;
    return 1 - (dist - plateau) / (edge - plateau);
  }

  function update() {
    ticking = false;

    const rect = scenesEl.getBoundingClientRect();
    const scrollableHeight = scenesEl.offsetHeight - window.innerHeight;
    if (scrollableHeight <= 0) return;

    const scrolled = -rect.top;
    const progress = Math.min(Math.max(scrolled / scrollableHeight, 0), 1);
    const band = progress * (count - 1);

    sceneParts.forEach(({ scene, media, overlay, content, card, ruleFill }, i) => {
      // Photo: wide, slow crossfade so backgrounds blend smoothly into each other.
      const mediaOpacity = trapezoid(band, i, 0.2, 0.85);
      // Text: narrower window with a lift-in, so outgoing/incoming copy don't
      // sit on top of each other for long — it reads as the new section's
      // text filling in once its photo has mostly taken over.
      const contentOpacity = trapezoid(band, i, 0.1, 0.42);
      const contentY = (1 - contentOpacity) * 16;

      media.style.opacity = mediaOpacity.toFixed(3);
      overlay.style.opacity = mediaOpacity.toFixed(3);
      content.style.opacity = contentOpacity.toFixed(3);
      content.style.transform = `translateY(${contentY.toFixed(2)}px)`;
      if (card) {
        card.style.opacity = contentOpacity.toFixed(3);
        card.style.transform = `translateY(${contentY.toFixed(2)}px)`;
      }
      if (ruleFill) {
        // One continuous line for the whole scroll journey, not per-scene —
        // it keeps growing smoothly as sections crossfade past it.
        ruleFill.style.transform = `scaleX(${progress.toFixed(3)})`;
      }

      scene.classList.toggle('is-active', contentOpacity > 0.5);
      scene.style.zIndex = String(i);
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
