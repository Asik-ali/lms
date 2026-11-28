import { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

let toastId = 0;
const listeners = new Set();

function notify(message, type) {
  const id = ++toastId;
  listeners.forEach(fn => fn({ id, message, type }));
  return id;
}

export function showSuccess(msg) { notify(msg, 'success'); }
export function showError(msg) { notify(msg, 'error'); }

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const dismiss = id => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts(previous => previous.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    const handler = (t) => {
      setToasts(prev => [...prev, t].slice(-3));
      timers.current.set(t.id, setTimeout(() => dismiss(t.id), t.type === 'error' ? 10000 : 4000));
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
      timers.current.forEach(timer => clearTimeout(timer));
      timers.current.clear();
    };
  }, []);

  return (
    <div aria-live="polite" className="fixed top-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map(t => {
        const bg = t.type === 'success' ? 'bg-green-600' : 'bg-red-600';
        const Icon = t.type === 'success' ? CheckCircle : AlertCircle;
        return (
          <div key={t.id} className={`flex items-center gap-2 ${bg} text-white px-4 py-3 rounded-lg shadow-lg text-sm`}>
            <Icon className="w-4 h-4 shrink-0" />
            <span className="min-w-0 break-words">{t.message}</span>
            <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(t.id)} className="ml-1 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><X size={17} aria-hidden="true" /></button>
          </div>
        );
      })}
    </div>
  );
}
