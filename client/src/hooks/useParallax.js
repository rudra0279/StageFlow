import { useState, useEffect } from 'react';

/**
 * Hook to provide subtle mouse parallax offsets (x, y) normalized between -1 and 1.
 */
export const useParallax = (sensitivity = 15) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const x = ((e.clientX / innerWidth) - 0.5) * 2; // -1 to 1
      const y = ((e.clientY / innerHeight) - 0.5) * 2; // -1 to 1
      setOffset({
        x: x * sensitivity,
        y: y * sensitivity,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [sensitivity]);

  return offset;
};

export default useParallax;
