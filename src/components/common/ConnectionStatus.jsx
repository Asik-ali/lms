import { useEffect, useState } from 'react';

export default function ConnectionStatus() {
  const [offline, setOffline] = useState(() => !navigator.onLine);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="shrink-0 border-b border-amber-500/30 bg-amber-100 px-4 py-2 text-center text-sm text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">
      No internet. Please turn on mobile data or Wi-Fi.
    </div>
  );
}
