# Cinemora — movie library starter

A responsive, static movie-library UI with category browsing, search, sample titles, a video player modal, download/open links, and a browser-local "Add title" form.

## Important current limitations
- This is a **front-end starter/demo**, not a secure public streaming backend.
- Added titles are saved to the current browser's localStorage only. Other visitors will not see them.
- The demo admin form is not protected by real authentication. Do not use it to publish private content.
- Demo player sources are public test clips, not actual feature films.
- Video downloads depend on the source host's CORS/download settings and the rights you have.
- Only distribute films/videos you own or are licensed to share.

## Run locally
Open `index.html` in a browser, or serve the folder with any static web server. The PWA manifest and service worker need HTTP/HTTPS to work.

## To make this production-ready
1. Deploy the frontend on a suitable static host.
2. Connect Supabase/Firebase authentication; authorize admin operations server-side (never trust a hidden button or a client-only secret).
3. Store movie metadata in a database with public read access only for published titles and admin-only writes.
4. Store large video files in a dedicated video/object-storage service with signed upload/download URLs, file-size/type validation, and appropriate access policies. GitHub Pages and git repositories are not movie storage.
5. Add video transcoding/streaming (HLS/DASH), subtitles, moderation/reporting, rate limiting, backup, and rights/takedown workflow before opening to the public.
6. Test the security rules and hosting/storage quotas before launch.

## Files
- `index.html` — responsive UI and demo behavior
- `manifest.webmanifest` — install metadata
- `sw.js` — basic static asset cache

## Hosting note
GitHub Pages is suitable for static UI previews, but has published size/bandwidth limits and should not host the actual video library. See [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits). Supabase's free storage upload size is limited (currently up to 50 MB per file) and its storage quota/egress are limited; see [Supabase file limits](https://supabase.com/docs/guides/storage/uploads/file-limits).
