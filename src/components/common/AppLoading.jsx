import { useEffect, useState } from 'react';

export default function AppLoading() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 15000);
    return () => clearTimeout(timer);
  }, []);
  return <div className="app-loader" role="status" aria-live="polite">
    <div className="boot-scene" aria-hidden="true"><div className="boot-halo" /><div className="boot-book"><span className="boot-book-label">E</span><span className="boot-book-lines" /><span className="boot-book-badge">✦</span></div><div className="boot-book-shadow" /></div>
    <p className="boot-eyebrow">YOUR NEXT CHAPTER</p>
    <h1 className="boot-brand">EXAM<span>STICK</span></h1>
    <p className="boot-message">{slow ? 'Loading is taking longer than expected. Check your connection and try again.' : 'Preparing your learning workspace...'}</p>
    <div className="boot-progress" aria-hidden="true"><span /></div>
    {slow && <button className="boot-reload" onClick={() => window.location.reload()}>Reload</button>}
    <p className="boot-caption">Learn. Practice. Move forward.</p>
  </div>;
}
