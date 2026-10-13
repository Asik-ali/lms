import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions, PDFDataRangeTransport } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ChevronLeft, ChevronRight, Minus, Plus, Maximize, Minimize } from 'lucide-react';
import PdfLoading from './PdfLoading';
import usePlayerFullscreen from './usePlayerFullscreen';
import './ProtectedPdfViewer.css';
import { supabase } from '../../supabase/client';
import { apiUrl } from '../../data/api';

GlobalWorkerOptions.workerSrc = workerUrl;

export default function ProtectedPdfViewer({ url, fileId, title, watermark }) {
  const canvas = useRef(null);
  const container = useRef(null);
  const { expanded, toggleFullscreen } = usePlayerFullscreen(container);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [pdf, setPdf] = useState(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const changed = () => setNativeFullscreen(document.fullscreenElement === container.current);
    document.addEventListener('fullscreenchange', changed);
    return () => document.removeEventListener('fullscreenchange', changed);
  }, []);

  useEffect(() => {
    let active = true;
    let task;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setPdf(null);
    setPage(1);
    setZoom(1);
    (async () => {
      if (fileId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Please sign in again to view the PDF.');
        const fetchRange = async (begin, end) => {
          const response = await fetch(apiUrl(`/api/course-pdf?fileId=${encodeURIComponent(fileId)}`), {
            headers: { Authorization: `Bearer ${session.access_token}`, Range: `bytes=${begin}-${end - 1}` }, signal: controller.signal,
          });
          if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.error || 'Unable to load PDF');
          }
          const range = response.headers.get('content-range')?.match(/^bytes (\d+)-(\d+)\/(\d+)$/);
          const total = Number(range?.[3]);
          const bytes = new Uint8Array(await response.arrayBuffer());
          if (!range || Number(range[1]) !== begin || Number(range[2]) !== begin + bytes.length - 1 || !total || begin + bytes.length > total || bytes.length > end - begin) {
            throw new Error('The server returned an invalid PDF range. Please reload the viewer.');
          }
          return { total, bytes };
        };
        const first = await fetchRange(0, 1024 * 1024);
        if (!active) return;
        const transport = new PDFDataRangeTransport(first.total, first.bytes);
        transport.requestDataRange = (begin, end) => {
          fetchRange(begin, end).then(result => { if (active) transport.onDataRange(begin, result.bytes); })
            .catch(err => { if (active) { setError(err.message); setLoading(false); task?.destroy(); } });
        };
        transport.abort = () => controller.abort();
        task = getDocument({ range: transport, length: first.total, rangeChunkSize: 1024 * 1024, disableAutoFetch: true, disableStream: true });
      } else {
        task = getDocument({ url, disableAutoFetch: true, disableStream: true });
      }
      const result = await task.promise;
      if (active) { setPdf(result); }
      else await result.destroy();
    })().catch(err => { if (active) setError(err.message || 'Unable to display PDF'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); task?.destroy(); };
  }, [url, fileId]);

  useEffect(() => {
    if (!pdf || !canvas.current) return;
    let active = true;
    let render;
    setRendering(true);
    pdf.getPage(page).then(result => {
      if (!active) return;
      const viewport = result.getViewport({ scale: zoom * 1.5 });
      const element = canvas.current;
      element.width = viewport.width;
      element.height = viewport.height;
      render = result.render({ canvasContext: element.getContext('2d'), viewport });
      return render.promise.then(() => {
        if (!active || !watermark) return;
        const context = element.getContext('2d');
        context.save();
        context.translate(element.width / 2, element.height / 2);
        context.rotate(-Math.PI / 6);
        context.font = `${Math.max(14, Math.min(32, element.width / (watermark.length * 0.7)))}px sans-serif`;
        context.fillStyle = 'rgba(80, 80, 80, 0.16)';
        context.textAlign = 'center';
        context.fillText(watermark, 0, 0, element.width * 0.8);
        context.restore();
      });
    }).catch(err => { if (active && err.name !== 'RenderingCancelledException') setError('This PDF page could not be displayed.'); })
      .finally(() => { if (active) setRendering(false); });
    return () => { active = false; render?.cancel(); };
  }, [pdf, page, zoom, watermark]);

  return (
    <div ref={container} onContextMenu={event => event.preventDefault()} className={`pdf-viewer select-none ${expanded ? 'pdf-viewer-expanded' : ''}`}>
      <div className="pdf-toolbar flex flex-wrap justify-between items-center gap-2 p-2 border-b border-navy-700">
        <span className="text-sm font-medium truncate min-w-0 flex-1">{title}</span>
        <button type="button" aria-label={expanded || nativeFullscreen ? 'Exit fullscreen PDF' : 'Fullscreen PDF'} onClick={toggleFullscreen} className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 hover:bg-navy-50 dark:hover:bg-navy-900">
          {expanded || nativeFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}<span className="text-xs">{expanded || nativeFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</span>
        </button>
      </div>
      {loading && <PdfLoading />}
      {error && <p role="alert" className="p-6 text-center text-navy-200">{error}</p>}
      {pdf && !error && <>
        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 p-3">
          <button aria-label="Previous PDF page" disabled={page <= 1} onClick={() => setPage(value => value - 1)}><ChevronLeft /></button>
          <span className="text-sm">{page} / {pdf.numPages}</span>
          <button aria-label="Next PDF page" disabled={page >= pdf.numPages} onClick={() => setPage(value => value + 1)}><ChevronRight /></button>
          <button aria-label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom(value => Math.max(0.5, value - 0.25))}><Minus /></button>
          <span className="text-xs">{Math.round(zoom * 100)}%</span>
          <button aria-label="Zoom in" disabled={zoom >= 3} onClick={() => setZoom(value => Math.min(3, value + 0.25))}><Plus /></button>
        </div>
        <div aria-busy={rendering} className="pdf-page-area relative overflow-auto bg-gray-200 p-2">
          {rendering && <div className="absolute inset-0 z-10 flex items-start justify-center bg-white/80 pt-6"><PdfLoading message="Rendering page..." /></div>}
          <canvas ref={canvas} aria-label={`${title}, page ${page}`} className="block mx-auto" style={{ width: `${zoom * 100}%`, height: 'auto' }} />
        </div>
      </>}
    </div>
  );
}
