/* ═══════════════════════════════════════════════════════════
   AI BRAIN — Scroll Animations
   ═══════════════════════════════════════════════════════════ */

export function initAnimations() {
  // Intersection Observer for reveal animations
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  document.querySelectorAll('.reveal').forEach((el) => {
    observer.observe(el);
  });
}
