// Central helper for building absolute API URLs. In the hosted web app the
// relative path /api/* works, but inside a Capacitor Android/iOS WebView the
// app origin is local, so relative paths break. We resolve against
// VITE_SITE_URL (the deployed site) so serverless API calls work in-app too.
export function apiUrl(path = '') {
  const siteUrl = import.meta.env.VITE_SITE_URL || '';
  if (siteUrl) {
    return siteUrl.replace(/\/$/, '') + (path.startsWith('/') ? path : `/${path}`);
  }
  return path;
}
