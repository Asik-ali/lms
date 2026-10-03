import { lazy, Suspense, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import ProtectedYouTubePlayer from './ProtectedYouTubePlayer';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedPdfViewer = lazy(() => import('./ProtectedPdfViewer'));

function getYouTubeEmbedUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be' || u.hostname === 'youtube.com' || u.hostname.endsWith('.youtube.com')) {
      const v = u.hostname === 'youtu.be' ? u.pathname.split('/')[1]
        : u.searchParams.get('v') || u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
      if (v && /^[\w-]{11}$/.test(v)) return `https://www.youtube.com/embed/${v}?controls=1&playsinline=1&fs=1`;
    }
  } catch {}
  return null;
}

function isDirectVideoUrl(url) {
  try {
    const u = new URL(url);
    const ext = u.pathname.split('.').pop().toLowerCase();
    return ['mp4', 'webm', 'ogg', 'mov', 'm4v', 'mkv'].includes(ext) && !u.hostname.includes('youtube.com') && u.hostname !== 'youtu.be' && u.hostname !== 'drive.google.com';
  } catch {}
  return false;
}

function getGoogleDrivePreviewUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'drive.google.com') {
      const dMatch = u.pathname.match(/\/d\/([^/]+)/);
      const id = dMatch ? dMatch[1] : u.searchParams.get('id');
      if (id) return `https://drive.google.com/file/d/${id}/preview`;
    } else if (u.hostname === 'docs.google.com' && u.pathname.includes('/uc')) {
      const id = u.searchParams.get('id');
      if (id) return `https://drive.google.com/file/d/${id}/preview`;
    }
  } catch {}
  return null;
}

export default function MediaViewer({ url, title, type, fileId, onClose }) {
  const { user } = useAuth();
  const [covered, setCovered] = useState(document.hidden);
  const [videoError, setVideoError] = useState(false);
  useEffect(() => { setVideoError(false); }, [url]);
  useEffect(() => {
    const onVisibility = () => {
      setCovered(document.hidden);
      if (document.hidden) document.querySelectorAll('video').forEach(video => video.pause());
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const ytEmbed = type === 'video' ? getYouTubeEmbedUrl(url) : null;
  const directVideo = type === 'video' ? isDirectVideoUrl(url) : false;
  const isDrive = (() => { try { return new URL(url).hostname === 'drive.google.com'; } catch { return false; } })();
  const drivePreview = getGoogleDrivePreviewUrl(url);
  let safeUrl = null;
  try {
    const parsed = new URL(url);
    if (['https:', 'http:'].includes(parsed.protocol)) safeUrl = parsed.href;
  } catch { /* Missing or invalid content should show the fallback. */ }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="relative w-full max-w-4xl max-h-[calc(100dvh-2rem)] overflow-y-auto bg-surface rounded-xl" onClick={e => e.stopPropagation()} onContextMenu={event => event.preventDefault()} onCopy={event => event.preventDefault()} onDragStart={event => event.preventDefault()}>
        <div className="flex items-center justify-between p-4 border-b border-navy-700">
          <h3 className="text-lg font-semibold text-navy-100 truncate pr-4">{title}</h3>
          <button aria-label="Close media viewer" onClick={onClose} className="p-1 text-navy-300 hover:text-navy-100 rounded-lg hover:bg-navy-700 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {safeUrl && type === 'video' && ytEmbed ? (
            <ProtectedYouTubePlayer embedUrl={ytEmbed} title={title} />
          ) : safeUrl && type === 'video' && drivePreview ? (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={drivePreview}
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-scripts allow-same-origin"
                title={title}
                className="absolute inset-0 w-full h-full rounded-lg"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; fullscreen"
                allowFullScreen
              />
              <div aria-hidden="true" className="absolute top-0 right-0 w-20 h-16 bg-black z-10" />
            </div>
          ) : safeUrl && type === 'video' && directVideo && !isDrive ? (
            <div>
            <video key={url} controls playsInline preload="metadata" controlsList="nodownload noremoteplayback" disablePictureInPicture onContextMenu={e => e.preventDefault()} onError={() => setVideoError(true)} className="w-full rounded-lg bg-black" style={{ maxHeight: '65dvh' }} src={url}>
              Your browser does not support the video tag.
            </video>
            {videoError && <p role="alert" className="mt-3 text-sm text-navy-200">This video could not be played. Check your connection or ask the course administrator for a supported video link.</p>}
            </div>
          ) : (safeUrl || fileId) && type === 'pdf' ? (
            <Suspense fallback={<p className="p-6 text-center">Loading PDF viewer...</p>}>
              <ProtectedPdfViewer url={safeUrl} fileId={fileId} title={title} />
            </Suspense>
          ) : (
            <div className="text-center py-10">
              <p className="text-navy-200 mb-4">
                This content cannot be played inside the app. Please contact the course administrator.
              </p>
            </div>
          )}
          <p aria-hidden="true" className="pointer-events-none select-none text-right text-xs text-navy-300 mt-2">{user?.email || user?.name || 'EXAMSTICK'}</p>
        </div>
        {covered && <div className="absolute inset-0 bg-black z-20" aria-hidden="true" />}
      </div>
    </div>
  );
}
