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

  const sceneParts = scenes.map((scene, i) => {
    scene.style.zIndex = String(i + 1);
    return {
      scene,
      content: scene.querySelector('.scene__content'),
      card: scene.querySelector('.scene__card'),
      ruleFill: scene.querySelector('.scene__rule-fill'),
    };
  });

  let ticking = false;

  function update() {
    ticking = false;
    const viewportH = window.innerHeight;

    sceneParts.forEach(({ scene, content, card, ruleFill }) => {
      const rect = scene.getBoundingClientRect();
      const holdRange = rect.height - viewportH;
      // 0 as this scene's panel starts sticking to the top, 1 once it's
      // about to be covered by the next panel rising over it.
      const local = holdRange > 0 ? Math.min(Math.max(-rect.top / holdRange, 0), 1) : 0;
      // Text fades/lifts in quickly once the panel is stuck in place —
      // the photo itself never fades, it's simply slid over by the next one.
      const contentOpacity = Math.min(local / 0.12, 1);
      const contentY = (1 - contentOpacity) * 16;

      content.style.opacity = contentOpacity.toFixed(3);
      content.style.transform = `translateY(${contentY.toFixed(2)}px)`;
      if (card) {
        card.style.opacity = contentOpacity.toFixed(3);
        card.style.transform = `translateY(${contentY.toFixed(2)}px)`;
      }
      if (ruleFill) {
        ruleFill.style.transform = `scaleX(${local.toFixed(3)})`;
      }

      scene.classList.toggle('is-active', contentOpacity > 0.5);
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
