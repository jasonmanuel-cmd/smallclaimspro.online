# SmallClaimsPro on Google Play

Approach: **Trusted Web Activity (TWA)**. The Play app opens smallclaimspro.online full screen in Chrome with no browser bar. One codebase: every site deploy updates the app, with no store re-review for content changes.

## Done in this repo (step 1)
- `manifest.webmanifest`, icons in `/icons`, `sw.js` (offline fallback, never caches form posts or `/.netlify/` calls), `offline.html`.
- Every public page links the manifest and registers the service worker.
- Launches from the Android app are tagged (`?source=twa` or an `android-app://` referrer) as `data-app="android"` on `<html>`, so app-only behavior (like hiding web checkout links) can be switched on with CSS or JS.

## Jay sets up (Claude can't)
1. **Play Console account:** one-time $25 fee. Use an **organization** account for Chaotically Organized AI, LLC. This needs a free D-U-N-S number, which can take up to 30 days. Personal accounts made after Nov 13, 2023 must run a closed test with 12 testers for 14 straight days before going live. A vendor guide says organization accounts are exempt; confirm that in Play Console.
2. **Package name:** `com.coai.smallclaimspro` (matches com.coai.neonbloom and com.coai.parlor).
3. **Signing:** turn on Play App Signing. Copy the app signing key's SHA-256 fingerprint from Play Console (Setup > App signing).
4. **Store listing:** privacy policy URL (https://smallclaimspro.online/privacy.html), screenshots, short and full description, content rating questionnaire, Data safety form (the app collects name, email, phone and case details, and payments go through Square).

## Build (Claude can do this once 3 is done)
```
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://smallclaimspro.online/manifest.webmanifest
#   package id: com.coai.smallclaimspro   start url: /?source=twa
bubblewrap build
```
Then publish `/.well-known/assetlinks.json` with the package name and the Play signing SHA-256. Without it, the app shows a browser bar.
New apps must target Android 16 (API 36) or higher. Check that the Bubblewrap version used outputs API 36.

## Policy risks to settle before submitting
- **Payments:** the $29 packet is a digital good. Play's payments policy expects Google Play Billing for digital goods. In the US, Google now allows external links or alternative billing **only if enrolled** in its US programs, with service fees reported from Oct 1, 2026. Fee amounts are not on Google's page. Options: (a) enroll in the US external content links program and keep Square, (b) Play Billing through the Digital Goods API, (c) ship v1 with the free analysis only and hide checkout in the app (`[data-app="android"]`).
  - **Done for testing:** inside the app, every Square checkout link (`a[href*="square.link"]`) is hidden and clicks on it are blocked, so closed-test builds carry no web checkout. Price text still shows; the $29/$99 links in emails sent by `queue-worker.js` are outside the app and unchanged. Revisit when the payments choice is made.
- **AI content:** Google's AI-generated content policy requires an in-app way to report offensive AI output. Its examples are chatbots and images. Add a "Report a problem with this answer" link to be safe.
- **Not a court:** the listing and app must not look like an official court or government service. Keep "Not affiliated with any court. Information and document support, not legal advice." in the listing and app.
- **No fake reviews or outcomes** in the listing (see the trust-cleanup PR).
