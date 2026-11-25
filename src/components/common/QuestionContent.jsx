import { useState } from 'react';

export function QuestionImage({ src, alt = 'Question diagram', diagram = false }) {
  const [zoom, setZoom] = useState(100);
  const [failed, setFailed] = useState(false);
  return <figure className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="btn-secondary px-3 py-2" aria-label="Zoom out diagram" disabled={zoom <= 50} onClick={() => setZoom(value => Math.max(50, value - 25))}>-</button>
      <output aria-live="polite" className="min-w-12 text-center text-sm">{zoom}%</output>
      <button type="button" className="btn-secondary px-3 py-2" aria-label="Zoom in diagram" disabled={zoom >= 300} onClick={() => setZoom(value => Math.min(300, value + 25))}>+</button>
      <button type="button" className="btn-secondary px-3 py-2" onClick={() => setZoom(100)}>Reset zoom</button>
      <a className="text-sm underline" href={src} target="_blank" rel="noopener noreferrer">Open full size</a>
    </div>
    {failed ? <p role="alert">The image could not load. Check your connection or open it full size.</p> :
      <div className="max-w-full overflow-auto rounded-lg border border-navy-200 bg-white p-2" tabIndex={0} aria-label="Scrollable diagram">
        <img src={src} alt={alt} onError={() => setFailed(true)} className="h-auto" style={{ width: `${(diagram ? 600 : 1000) * zoom / 100}px`, maxWidth: 'none' }} />
      </div>}
    <figcaption className="text-xs text-muted">Scroll sideways to view a wide figure. Use + and - to change its size.</figcaption>
  </figure>;
}

export default function QuestionContent({ question, language = 'English' }) {
  const value = String(question?.question || '');
  const isImage = /^https?:\/\/.*\.(png|jpe?g|webp)(\?.*)?$/i.test(value);
  const diagrams = question?.diagrams || [];
  return <div className="space-y-4">
    {isImage ? <QuestionImage src={value} alt="Original source question and options" /> : value.startsWith('http') ?
      <a className="underline" href={value} target="_blank" rel="noopener noreferrer">Open question</a> :
      <p lang={language === 'Tamil' ? 'ta' : 'en'} className="whitespace-pre-wrap text-lg leading-loose text-navy-100">{value}</p>}
    {diagrams.map((diagram, index) => <QuestionImage key={diagram.url || diagram} src={diagram.url || diagram} alt={diagram.alt || `Question diagram ${index + 1}`} diagram />)}
  </div>;
}
