import { useEffect, useState } from 'react';

export default function useTypewriter(text, { speed = 90, startDelay = 500, loop = true, holdDelay = 2000, deleteSpeed = 45, loopPause = 350 } = {}) {
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState('typing');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(text.length);
      setPhase('typing');
      return;
    }
    const t = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(t);
  }, [startDelay, text]);

  useEffect(() => {
    if (!started) return;

    if (phase === 'typing') {
      if (count < text.length) {
        const t = setTimeout(() => setCount(c => c + 1), speed);
        return () => clearTimeout(t);
      }
      if (!loop) return;
      const t = setTimeout(() => setPhase('deleting'), holdDelay);
      return () => clearTimeout(t);
    }

    if (count > 0) {
      const t = setTimeout(() => setCount(c => c - 1), deleteSpeed);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPhase('typing'), loopPause);
    return () => clearTimeout(t);
  }, [started, phase, count, text.length, speed, loop, holdDelay, deleteSpeed, loopPause]);

  return text.slice(0, count);
}