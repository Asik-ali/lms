import { useEffect, useState } from 'react';

export default function usePlayerFullscreen(container) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const escape = event => { if (event.key === 'Escape' && expanded) { event.stopImmediatePropagation(); setExpanded(false); } };
    document.addEventListener('keydown', escape, true);
    return () => document.removeEventListener('keydown', escape, true);
  }, [expanded]);
  const toggleFullscreen = async () => {
    if (expanded) { setExpanded(false); return; }
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (container.current?.requestFullscreen) await container.current.requestFullscreen();
      else setExpanded(true);
    } catch { setExpanded(true); }
  };
  return { expanded, toggleFullscreen };
}
