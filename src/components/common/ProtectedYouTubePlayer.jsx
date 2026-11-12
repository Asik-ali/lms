export default function ProtectedYouTubePlayer({ embedUrl, title, autoplay = false }) {
  const source = new URL(embedUrl);
  source.searchParams.set('controls', autoplay ? '0' : '1');
  source.searchParams.set('playsinline', '1');
  source.searchParams.set('rel', '0');
  source.searchParams.set('fs', autoplay ? '0' : '1');
  if (autoplay) {
    const videoId = source.pathname.split('/').filter(Boolean).pop();
    source.searchParams.set('autoplay', '1');
    source.searchParams.set('mute', '1');
    source.searchParams.set('disablekb', '1');
    source.searchParams.set('iv_load_policy', '3');
    source.searchParams.set('loop', '1');
    if (videoId) source.searchParams.set('playlist', videoId);
  }

  return (
    <div className="w-full overflow-hidden rounded-lg bg-black">
      <iframe
        src={source.href}
        title={title}
        referrerPolicy="strict-origin-when-cross-origin"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="block aspect-video w-full border-0"
      />
    </div>
  );
}
