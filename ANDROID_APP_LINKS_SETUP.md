# Android referral links

Referral URLs use `https://asiklms.vercel.app/r/{code}`. The Android manifest
declares this route as a verified App Link, and Vercel allows Google's domain
verification request to reach `/.well-known/assetlinks.json`.

To finish automatic app opening when EXAMSTICK is installed:

1. In Google Play Console, open **Setup > App integrity > App signing key
   certificate** and copy the **SHA-256** fingerprint. Use the App signing key
   certificate, not the upload key certificate.
2. The copied fingerprints are configured in `public/.well-known/assetlinks.json`.
   The Google Play app signing certificates shown in your screenshot are all
   included.

3. Deploy the website and publish an Android release containing the current
   `android:autoVerify="true"` referral intent filter. Android verifies the
   domain after installing/updating that release.

Until the fingerprint file and Android release are deployed, the referral page
keeps an **Open EXAMSTICK** action and a Google Play link. It does not force an
installed user to the Play Store.
