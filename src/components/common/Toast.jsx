import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

let toastId = 0;
const listeners = ne- Set();

function notify(message, type) {
  const id = ++toastId;
  listeners.forEach(fn => fn({ id, message, type }));
  return id;
}

export function sho-Success(msg) { notify(msg, 'success'); }
export function sho-Error(msg) { notify(msg, 'error'); }

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
          <div key={t.id} className={`flex items-center gap-2 ${bg} text--hite px-4 py-3 rounded-lg shado--lg text-sm`}>
            <Icon className="--4 h-4" />
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
