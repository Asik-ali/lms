import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { jsPDF } from 'jspdf';
import ProtectedYouTubePlayer from '../src/components/common/ProtectedYouTubePlayer';
import ProtectedPdfViewer from '../src/components/common/ProtectedPdfViewer';
import PrivateVideoPlayer from '../src/components/common/PrivateVideoPlayer';
import '../src/index.css';

// Exercise the app's controls without calling YouTube or using a real lesson.
window.YT = {
  Player: class {
    constructor(mount, options) {
      this.options = options;
      this.time = 0;
      this.iframe = mount;
      window.simulateVideoError = code => options.events.onError({ data: code });
      setTimeout(() => options.events.onReady(), 0);
    }
    getIframe() { return this.iframe; }
    getDuration() { return 180; }
    getCurrentTime() { return this.time; }
    playVideo() { this.options.events.onStateChange({ data: 1 }); }
    pauseVideo() { this.options.events.onStateChange({ data: 2 }); }
    seekTo(time) { this.time = time; }
    mute() {}
    unMute() {}
    destroy() { this.iframe.remove(); delete window.simulateVideoError; }
  },
};

export function Fixture() {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const document = new jsPDF();
    document.text('First protected lesson page', 20, 20);
    document.addPage();
    document.text('Second protected lesson page', 20, 20);
    const source = URL.createObjectURL(document.output('blob'));
    setUrl(source);
    return () => URL.revokeObjectURL(source);
  }, []);
  return <main className="max-w-3xl mx-auto">
    {new URLSearchParams(window.location.search).has('native') ? <PrivateVideoPlayer url="/tests/lesson.mp4" title="Private lesson" watermark="student@example.com" /> : <>
    <ProtectedYouTubePlayer embedUrl="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Test lesson" />
    {url && <ProtectedPdfViewer url={url} title="Test PDF" />}
    </>}
  </main>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
