import React, { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Number that counts up once when scrolled into view.
 * With prefers-reduced-motion it shows the final value immediately.
 * The animated digits are hidden from screen readers, which get the final value.
 */
export default function Counter({ value, decimals = 0, prefix = '', suffix = '', duration = 1600 }) {
  const ref = useRef(null);
  const [n, setN] = useState(prefersReducedMotion() ? value : 0);

  useEffect(() => {
    if (prefersReducedMotion() || !ref.current) {
      setN(value);
      return undefined;
    }
    let raf;
    const run = () => {
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / duration);
        setN(value * (1 - Math.pow(1 - p, 3))); // ease-out cubic
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) {
      run();
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          io.disconnect();
          run();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(ref.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  const fmt = (x) => x.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span ref={ref}>
      <span aria-hidden="true">{prefix}{fmt(n)}{suffix}</span>
      <span className="sr-only">{prefix}{fmt(value)}{suffix}</span>
    </span>
  );
}
