export default function ProtectedYouTubePlayer({ embedUrl, title }) {
  const source = new URL(embedUrl);
  source.searchParams.set('controls', '1');
  source.searchParams.set('playsinline', '1');
  source.searchParams.set('rel', '0');
  source.searchParams.set('fs', '1');

  return (
    <div className="w-full overflow-hidden rounded-lg bg-black">
      <iframe
        src={source.href}
        title={title}
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="block aspect-video w-full border-0"
      />
    </div>
  );
}
