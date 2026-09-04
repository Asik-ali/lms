import { useEffect, useState } from 'react';

export default function useTypewriter(text, { speed = 90, startDelay = 500 } = {}) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(text.length);
      return;
    }
    const t = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(t);
  }, [startDelay, text]);

  useEffect(() => {
    if (!started || count >= text.length) return;
    const t = setTimeout(() => setCount(c => c + 1), speed);
    return () => clearTimeout(t);
  }, [started, count, speed, text.length]);

  return text.slice(0, count);
}