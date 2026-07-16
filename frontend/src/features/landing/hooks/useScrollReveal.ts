import { useEffect, useRef } from 'react';

/**
 * Lightweight scroll-reveal hook using IntersectionObserver.
 * Attach the returned ref to any container element.
 * Children with `data-reveal` will animate in when they enter the viewport.
 * Use `data-reveal-delay="200"` for staggered delays (in ms).
 */
export function useScrollReveal(threshold = 0.15) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll('[data-reveal]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset.revealDelay || '0';
            el.style.transitionDelay = `${delay}ms`;
            el.classList.add('revealed');
            observer.unobserve(el);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [threshold]);

  return containerRef;
}
