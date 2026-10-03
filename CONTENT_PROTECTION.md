Content protection rollout
==========================

1. Apply `src/supabase/migrations/protect_course_pdf_links.sql` in the Supabase SQL editor **before deploying** the web update. This removes public access to original PDF URLs and adds an authenticated metadata function. Admin PDF management keeps its existing access.
2. Deploy the website and API endpoints together, including `/api/course-pdf`. The Android app loads the hosted website, so a local web build alone does not update installed apps.
3. Install `android/app/build/outputs/apk/release/app-release.apk`. Capture protection is native Android code and needs this updated APK. It is enabled at startup and on resume, including fullscreen content.
4. Test a course with a YouTube lesson and a Drive PDF using an enrolled student account. Verify play/pause, seeking, fullscreen, PDF paging/zoom, blocked external navigation, screenshots, and screen recording on a real device.

PDFs use a canvas viewer with page and zoom controls. It has no download, print, share, or open-in-browser controls. Course access is checked on each authenticated PDF range request; original Drive URLs are not sent to students after the migration. Drive files must be readable by the server, and the viewer supports files up to 32 MB. Supabase Storage PDFs are also supported. Other hosted PDF URLs need an approved backend adapter.

YouTube lessons and live classes use app-owned controls. Provider links cannot be clicked or reached with keyboard focus. Provider header/footer controls are covered; paused and ended overlays are covered. The masks cover some of the picture at the top and bottom. YouTube playback is verified through a simulated player in automated tests; real provider playback still needs device testing.

These UI measures do not make public YouTube videos private and do not prevent inspection of YouTube's iframe URL. Browsers cannot reliably block screenshots or recording. Android FLAG_SECURE requests OS capture protection, but modified devices and external cameras can bypass it. For stronger protection, use authenticated private media hosting with DRM instead of public YouTube/Drive links.

The broader review also corrected test scoring, marked-answer analysis, webhook verification, and authenticated automatic backups. Set `CRON_SECRET` for Vercel's automatic backup job. Cashfree webhook verification uses the PG client secret for the selected environment unless `CASHFREE_WEBHOOK_SECRET` explicitly overrides it.

Validation: `npm test`, `npm run test:browser`, `npm run build`, `npm run lint`, and the Android release build. Browser tests use locally generated PDF data and a simulated YouTube player; they do not use student accounts or send email/payment requests.
