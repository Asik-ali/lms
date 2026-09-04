import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

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

  useEffect(() => {
    const handler = (t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id));
      }, 3000);
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => {
        const bg = t.type === 'success' ? 'bg-green-600' : 'bg-red-600';
        const Icon = t.type === 'success' ? CheckCircle : AlertCircle;
        return (
          <div key={t.id} className={`flex items-center gap-2 ${bg} text-navy-100 px-4 py-3 rounded-lg shadow-lg text-sm`}>
            <Icon className="w-4 h-4" />
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
