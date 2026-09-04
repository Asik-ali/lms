import { useEffect } from 'react';
import { X } from 'lucide-react';

function getYouTubeEmbedUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.endsWith('youtube.com')) {
      if (u.pathname === '/embed') return url;
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
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

export default function MediaViewer({ url, title, type, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const ytEmbed = type === 'video' ? getYouTubeEmbedUrl(url) : null;
  const directVideo = type === 'video' ? isDirectVideoUrl(url) : false;
  const isDrive = (() => { try { return new URL(url).hostname === 'drive.google.com'; } catch { return false; } })();
  const drivePreview = type === 'pdf' ? getGoogleDrivePreviewUrl(url) : null;
  const pdfSrc = drivePreview || url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="relative w-full max-w-4xl bg-surface rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-navy-700">
          <h3 className="text-lg font-semibold text-white truncate pr-4">{title}</h3>
          <button onClick={onClose} className="p-1 text-navy-300 hover:text-gray-600 dark:hover:text-gray-400 rounded-lg hover:bg-gray-100 hover:bg-navy-700 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {type === 'video' && ytEmbed ? (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={ytEmbed}
                title={title}
                className="absolute inset-0 w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : type === 'video' && directVideo && !isDrive ? (
            <video controls autoPlay className="w-full rounded-lg" style={{ maxHeight: '80vh' }} src={url}>
              Your browser does not support the video tag.
            </video>
          ) : type === 'pdf' ? (
            <iframe
              src={pdfSrc}
              title={title}
              className="w-full rounded-lg"
              style={{ height: '80vh' }}
            />
          ) : (
            <div className="text-center py-10">
              <p className="text-navy-200 mb-4">
                {isDrive ? 'This Google Drive link opens in a new tab.' : 'This media type cannot be previewed here.'}
              </p>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="btn-primary inline-flex items-center gap-2 px-4 py-2"
                onClick={onClose}
              >
                Open in new tab
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
