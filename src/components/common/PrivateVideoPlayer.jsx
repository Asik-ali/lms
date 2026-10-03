import { useEffect, useRef, useState } from 'react';
import { Maximize, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

const clock = seconds => {
  const value = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
};

export default function PrivateVideoPlayer({ url, title, watermark }) {
  const video = useRef(null);
  const container = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [ready, setReady] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    setPlaying(false);
    setEnded(false);
    setReady(false);
    setTime(0);
    setDuration(0);
    setMuted(false);
    setRate(1);
    setError('');
  }, [url]);

  useEffect(() => {
    const pause = () => { if (document.hidden) video.current?.pause(); };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);

  const toggle = async () => {
    if (!video.current || error) return;
    if (playing) video.current.pause();
    else {
      if (ended) video.current.currentTime = 0;
      try { await video.current.play(); }
      catch { setError('Playback could not start. Please reload the lesson and try again.'); }
    }
  };

  return <div ref={container} className="w-full rounded-lg overflow-hidden bg-black text-white flex flex-col" onContextMenu={event => event.preventDefault()}>
    <div className="relative aspect-video flex-1 min-h-0">
      <video ref={video} key={url} src={url} aria-label={title} playsInline preload="metadata" disablePictureInPicture disableRemotePlayback
        className="absolute inset-0 w-full h-full object-contain"
        onLoadedMetadata={event => {
          const length = event.currentTarget.duration;
          setDuration(Number.isFinite(length) ? length : 0);
          setReady(true);
        }}
        onTimeUpdate={event => setTime(event.currentTarget.currentTime)}
        onPlay={() => { setPlaying(true); setEnded(false); }} onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setEnded(true); }}
        onError={() => setError('This video could not be played. Ask the course administrator for a supported video file.')}
      />
      {(error || !playing) && <button aria-label={ended ? 'Replay lesson' : 'Play lesson'} disabled={!ready || Boolean(error)} onClick={toggle}
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 to-black p-6">
        {error ? <span role="alert" className="text-sm">{error}</span> : <>
          <span className="text-xs uppercase tracking-widest text-slate-400">Lesson player</span>
          <span className="text-center text-base sm:text-xl font-semibold line-clamp-2">{title}</span>
          {ready && <span className="rounded-full bg-white/10 p-4">{ended ? <RotateCcw /> : <Play />}</span>}
          <span className="text-sm text-slate-300">{!ready ? 'Loading video...' : ended ? 'Replay lesson' : time > 0 ? 'Resume lesson' : 'Start lesson'}</span>
        </>}
      </button>}
      {watermark && <span aria-hidden="true" className="absolute right-3 bottom-3 pointer-events-none select-none rounded bg-black/40 px-2 py-1 text-xs text-white/60 max-w-[80%] truncate">{watermark}</span>}
    </div>
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3">
      <button disabled={!ready || Boolean(error)} aria-label={playing ? 'Pause lesson' : 'Play lesson'} onClick={toggle}>{playing ? <Pause /> : <Play />}</button>
      <span className="text-xs">{clock(time)}</span>
      <input aria-label="Seek video" type="range" min="0" max={duration || 1} step="0.1" value={Math.min(time, duration || 1)} disabled={!ready || !duration || Boolean(error)} className="min-w-0 flex-1"
        onChange={event => { const next = Number(event.target.value); video.current.currentTime = next; setTime(next); }} />
      <span className="text-xs">{clock(duration)}</span>
      <button disabled={!ready || Boolean(error)} aria-label={muted ? 'Unmute video' : 'Mute video'} onClick={() => { video.current.muted = !muted; setMuted(!muted); }}>{muted ? <VolumeX /> : <Volume2 />}</button>
      <select aria-label="Playback speed" value={rate} disabled={!ready || Boolean(error)} className="bg-black text-white text-xs" onChange={event => { const next = Number(event.target.value); video.current.playbackRate = next; setRate(next); }}>
        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(value => <option key={value} value={value}>{value}x</option>)}
      </select>
      <button aria-label="Fullscreen video" onClick={async () => {
        try { if (document.fullscreenElement) await document.exitFullscreen(); else await container.current.requestFullscreen(); }
        catch { /* Fullscreen may be unavailable in the device WebView. */ }
      }}><Maximize /></button>
    </div>
  </div>;
}
