import { useRef } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import usePlayerFullscreen from './usePlayerFullscreen';

export default function ProtectedYouTubePlayer({ embedUrl, title, autoplay = false }) {
  const container = useRef(null);
  const { expanded, fullscreen, toggleFullscreen } = usePlayerFullscreen(container);
  const source = new URL(embedUrl);
  source.searchParams.set('controls', '1');
  source.searchParams.set('playsinline', '1');
  source.searchParams.set('rel', '0');
  source.searchParams.set('fs', '1');
  source.searchParams.set('disablekb', '0');
  for (const key of ['loop', 'playlist', 'mute']) source.searchParams.delete(key);
  if (autoplay) {
    source.searchParams.set('autoplay', '1');
    source.searchParams.set('iv_load_policy', '3');
  }

  return (
    <div ref={container} className={`player-shell w-full min-w-0 overflow-hidden rounded-lg bg-black text-white ${expanded ? 'player-expanded' : ''}`}>
      <iframe
        src={source.href}
        title={title}
        referrerPolicy="strict-origin-when-cross-origin"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        className="block aspect-video w-full border-0"
      />
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <span className="min-w-0 truncate text-sm">{title}</span>
        <button type="button" aria-label={fullscreen ? 'Exit fullscreen video' : 'Fullscreen video'} onClick={toggleFullscreen} className="flex shrink-0 items-center justify-center rounded-lg p-2 hover:bg-white/10">
          {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>
    </div>
  );
}
