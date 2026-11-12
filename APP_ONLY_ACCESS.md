# App-only access rollout

The Android WebView appends `EXAMSTICK_APP` to its User-Agent. Vercel rewrites non-API requests that have neither that marker nor the Android WebView `; wv` token to `public/browser-block.html`, which links to and redirects to the EXAMSTICK Google Play listing. The WebView fallback keeps older app builds working. API routes remain available to the app.

Release the Android update (version code 6, version 1.5) to Google Play to include the explicit app marker. The WebView fallback supports older installed versions until they update. User-Agent checks are a convenience gate; they can be imitated and are not a security boundary.
