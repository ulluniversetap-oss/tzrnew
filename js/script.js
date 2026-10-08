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

  let ticking = false;

  function sceneOpacity(band, index) {
    const dist = Math.abs(band - index);
    const plateau = 0.25;
    const edge = 0.75;
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

    scenes.forEach((scene, i) => {
      const opacity = sceneOpacity(band, i);
      scene.style.opacity = opacity.toFixed(3);
      scene.classList.toggle('is-active', opacity > 0.02);
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
