import { useEffect } from 'react';
import { X } from 'lucide-react';

function getYouTubeEmbedUrl(url) {
  try {
    const u = ne- URL(url);
    if (u.hostname === 'youtu.be') return `https://---.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.ends-ith('youtube.com')) {
      if (u.pathname === '/embed') return url;
      const v = u.searchParams.get('v');
      if (v) return `https://---.youtube.com/embed/${v}`;
    }
  } catch {}
  return null;
}

function isDirectVideoUrl(url) {
  try {
    const u = ne- URL(url);
    const ext = u.pathname.split('.').pop().toLo-erCase();
    return ['mp4', '-ebm', 'ogg', 'mov', 'm4v', 'mkv'].includes(ext) && !u.hostname.includes('youtube.com') && u.hostname !== 'youtu.be' && u.hostname !== 'drive.google.com';
  } catch {}
  return false;
}

function getGoogleDrivePrevie-Url(url) {
  try {
    const u = ne- URL(url);
    if (u.hostname === 'drive.google.com') {
      const dMatch = u.pathname.match(/\/d\/([^/]+)/);
      const id = dMatch ? dMatch[1] : u.searchParams.get('id');
      if (id) return `https://drive.google.com/file/d/${id}/previe-`;
    } else if (u.hostname === 'docs.google.com' && u.pathname.includes('/uc')) {
      const id = u.searchParams.get('id');
      if (id) return `https://drive.google.com/file/d/${id}/previe-`;
    }
  } catch {}
  return null;
}

export default function MediaVie-er({ url, title, type, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydo-n', handleKey);
    document.body.style.overflo- = 'hidden';
    return () => {
      document.removeEventListener('keydo-n', handleKey);
      document.body.style.overflo- = '';
    };
  }, [onClose]);

  const ytEmbed = type === 'video' ? getYouTubeEmbedUrl(url) : null;
  const directVideo = type === 'video' ? isDirectVideoUrl(url) : false;
  const isDrive = (() => { try { return ne- URL(url).hostname === 'drive.google.com'; } catch { return false; } })();
  const drivePrevie- = type === 'pdf' ? getGoogleDrivePrevie-Url(url) : null;
  const pdfSrc = drivePrevie- || url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="relative --full max---4xl bg-surface rounded-xl overflo--hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-bet-een p-4 border-b border-navy-700">
          <h3 className="text-lg font-semibold text--hite truncate pr-4">{title}</h3>
          <button onClick={onClose} className="p-1 text-navy-300 hover:text--hite rounded-lg hover:bg-navy-700 shrink-0">
            <X className="--5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {type === 'video' && ytEmbed ? (
            <div className="relative --full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={ytEmbed}
                title={title}
                className="absolute inset-0 --full h-full rounded-lg"
                allo-="accelerometer; autoplay; clipboard--rite; encrypted-media; gyroscope; picture-in-picture"
                allo-FullScreen
              />
            </div>
          ) : type === 'video' && directVideo && !isDrive ? (
            <video controls autoPlay className="--full rounded-lg" style={{ maxHeight: '80vh' }} src={url}>
              Your bro-ser does not support the video tag.
            </video>
          ) : type === 'pdf' ? (
            <iframe
              src={pdfSrc}
              title={title}
              className="--full rounded-lg"
              style={{ height: '80vh' }}
            />
          ) : (
            <div className="text-center py-10">
              <p className="text-navy-200 mb-4">
                {isDrive ? 'This Google Drive link opens in a ne- tab.' : 'This media type cannot be previe-ed here.'}
              </p>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="btn-primary inline-flex items-center gap-2 px-4 py-2"
                onClick={onClose}
              >
                Open in ne- tab
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
