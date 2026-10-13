export function isChunkLoadError(error) {
  return /failed to fetch dynamically imported module|importing a module script failed|failed to load module script|loading chunk|unable to preload css/i.test(error?.message || String(error || ''));
}

export function recoverChunkLoad(error, {
  storage = window.sessionStorage, location = window.location,
  online = navigator.onLine, now = Date.now(),
} = {}) {
  if (!online || !isChunkLoadError(error)) return false;
  try {
    const previous = Number(storage.getItem('lms-chunk-reload-at'));
    if (previous && now - previous < 60000) return false;
    storage.setItem('lms-chunk-reload-at', String(now));
  } catch { return false; }
  location.reload();
  return true;
}
