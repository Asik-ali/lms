import { Layers, ArrowUpRight } from 'lucide-react';

export default function TestExperienceHeader({ title, subtitle }) {
  return (
    <div className="test-experience-header">
      <div className="relative z-10">
        <span className="test-experience-eyebrow"><Layers size={14} /> Your practice space</span>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-navy-100">{title}</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-navy-200">{subtitle}</p>
      </div>
      <div className="test-orbit" aria-hidden="true">
        <div className="test-orbit-ring" />
        <div className="test-orbit-tile"><Layers size={36} strokeWidth={1.5} /></div>
        <div className="test-orbit-dot"><ArrowUpRight size={20} /></div>
      </div>
    </div>
  );
}
