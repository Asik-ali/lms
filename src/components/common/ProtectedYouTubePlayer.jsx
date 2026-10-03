import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Maximize, Volume2, VolumeX } from 'lucide-react';

let apiPromise;
function loadPlayerApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    const timeout = setTimeout(() => { apiPromise = null; reject(new Error('Video player could not load')); }, 15000);
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      previous?.();
      resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => { clearTimeout(timeout); apiPromise = null; reject(new Error('Video player could not load')); };
    document.head.appendChild(script);
  });
  return apiPromise;
}

function formatTime(seconds) {
  const value = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

export default function ProtectedYouTubePlayer({ embedUrl, title }) {
  const host = useRef(null);
  const container = useRef(null);
  const player = useRef(null);
  const [ready, setReady] = useState(false);
  const [state, setState] = useState(-1);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [rates, setRates] = useState([1]);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let instance;
    let timer;
    setReady(false);
    setError('');
    setState(-1);
    setTime(0);
    setDuration(0);
    setMuted(false);
    setRate(1);
    setRates([1]);
    const mount = document.createElement('div');
    host.current.replaceChildren(mount);
    loadPlayerApi().then(YT => {
      if (!active) return;
      instance = new YT.Player(mount, {
        videoId: new URL(embedUrl).pathname.split('/').pop(),
        width: '100%', height: '100%',
        playerVars: { controls: 0, disablekb: 1, fs: 0, playsinline: 1, rel: 0, origin: window.location.origin },
        events: {
          onReady: () => {
            if (!active) return;
            player.current = instance;
            const iframe = instance.getIframe();
            iframe.title = title;
            iframe.tabIndex = -1;
            iframe.style.pointerEvents = 'none';
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
            setReady(true);
            setRates(instance.getAvailablePlaybackRates?.() || [1]);
            timer = setInterval(() => {
              setTime(instance.getCurrentTime());
              setDuration(instance.getDuration());
            }, 500);
          },
          onStateChange: event => { if (active) setState(event.data); },
          onError: () => { if (active) setError('This lesson could not be played. Please contact the course administrator.'); },
        },
      });
    }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; clearInterval(timer); player.current = null; instance?.destroy(); };
  }, [embedUrl, title]);

  const togglePlayback = () => {
    if (state === 1) player.current?.pauseVideo();
    else player.current?.playVideo();
  };

  useEffect(() => {
    const pauseWhenHidden = () => { if (document.hidden) player.current?.pauseVideo(); };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, []);

  return (
    <div ref={container} className="w-full bg-black rounded-lg overflow-hidden flex flex-col" onContextMenu={event => event.preventDefault()}>
      <div className="relative aspect-video w-full overflow-hidden">
        <div ref={host} className="absolute inset-0 pointer-events-none" />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-16 bg-black pointer-events-auto" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-12 bg-black pointer-events-auto" />
        {state !== 1 && state !== 3 && (
          <button disabled={!ready || Boolean(error)} onClick={togglePlayback} aria-label="Play lesson" className="absolute inset-0 bg-black text-white flex items-center justify-center">
            {error ? <span role="alert" className="px-6 text-sm">{error}</span> : ready ? <Play className="w-12 h-12" /> : <span>Loading video...</span>}
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 text-white bg-black">
        <button disabled={!ready || Boolean(error)} onClick={togglePlayback} aria-label={state === 1 ? 'Pause lesson' : 'Play lesson'}>{state === 1 ? <Pause /> : <Play />}</button>
        <span className="text-xs whitespace-nowrap">{formatTime(time)}</span>
        <input aria-label="Seek video" type="range" min="0" max={duration || 1} value={Math.min(time, duration || 1)} disabled={!ready || !duration} onChange={event => { const next = Number(event.target.value); player.current?.seekTo(next, true); setTime(next); }} className="min-w-0 flex-1" />
        <span className="text-xs whitespace-nowrap">{formatTime(duration)}</span>
        <button disabled={!ready} aria-label={muted ? 'Unmute video' : 'Mute video'} onClick={() => { if (muted) player.current?.unMute(); else player.current?.mute(); setMuted(!muted); }}>{muted ? <VolumeX /> : <Volume2 />}</button>
        {rates.length > 1 && <select aria-label="Playback speed" value={rate} onChange={event => { const next = Number(event.target.value); player.current?.setPlaybackRate(next); setRate(next); }} className="bg-black text-white text-xs">
          {rates.map(value => <option key={value} value={value}>{value}x</option>)}
        </select>}
        <button aria-label="Fullscreen video" onClick={async () => {
          try { if (document.fullscreenElement) await document.exitFullscreen(); else await container.current.requestFullscreen(); }
          catch { setError('Fullscreen is unavailable on this device.'); }
        }}><Maximize /></button>
      </div>
    </div>
  );
}
