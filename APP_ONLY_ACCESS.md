# App-only access rollout

The Android WebView appends `EXAMSTICK_APP` to its User-Agent. Vercel rewrites non-API browser requests without that marker to `public/browser-block.html`, which links to and redirects to the EXAMSTICK Google Play listing. API routes remain available to the app.

Release the Android update (version code 6, version 1.5) to Google Play before deploying the Vercel browser gate. Older installed versions do not send the marker and will be shown the browser notice after the gate is deployed. The User-Agent marker is a convenience gate; it can be imitated and is not a security boundary.
