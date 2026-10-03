import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions, PDFDataRangeTransport } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { supabase } from '../../supabase/client';
import { apiUrl } from '../../data/api';

GlobalWorkerOptions.workerSrc = workerUrl;

export default function ProtectedPdfViewer({ url, fileId, title }) {
  const canvas = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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
    pdf.getPage(page).then(result => {
      if (!active) return;
      const viewport = result.getViewport({ scale: zoom * 1.5 });
      const element = canvas.current;
      element.width = viewport.width;
      element.height = viewport.height;
      render = result.render({ canvasContext: element.getContext('2d'), viewport });
      return render.promise;
    }).catch(err => { if (active && err.name !== 'RenderingCancelledException') setError('This PDF page could not be displayed.'); });
    return () => { active = false; render?.cancel(); };
  }, [pdf, page, zoom]);

  return (
    <div onContextMenu={event => event.preventDefault()} className="select-none">
      {loading && <p className="p-6 text-center">Loading PDF...</p>}
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
        <div className="overflow-auto max-h-[65dvh] bg-gray-200 p-2">
          <canvas ref={canvas} aria-label={`${title}, page ${page}`} className="block mx-auto" style={{ width: `${zoom * 100}%`, height: 'auto' }} />
        </div>
      </>}
    </div>
  );
}
