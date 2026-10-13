# Cinemora Movie Platform

Responsive movie discovery frontend with a separate authenticated admin panel and Supabase-backed catalogue/media workflow.

## Pages
- `index.html` — public landing page with a Cloudflare Turnstile human-verification gate.
- `catalog.html` — searchable, filterable live catalogue and signed playback.
- `admin.html` — Supabase Auth login and admin-only upload/publish management.
- `supabase/schema.sql` — database tables, row-level security, and private media bucket.
- `supabase/functions/create-upload` — authenticated admin upload URL.
- `supabase/functions/signed-media` — short-lived playback URL for published titles.
- `supabase/functions/verify-captcha` — server-side Cloudflare Turnstile validation.

## Important
This repository contains the website code, not movie files. Only upload and distribute films/videos you own or are licensed to share. The project is **not live or production-ready until the external services below are configured and deployed**. No load or penetration test has been performed, and no unlimited capacity or zero-attack guarantee is possible.

## Quick setup
1. Create a Supabase project and run `supabase/schema.sql` in its SQL Editor.
2. Create an administrator account in Supabase Auth, then run the admin bootstrap SQL at the bottom of `supabase/schema.sql` using your account email.
3. Copy `supabase-config.js.example` to `supabase-config.js`; fill in the Supabase project URL, browser publishable/anon key, and Cloudflare Turnstile **site key**. Never put a service-role key or Turnstile secret in this file.
4. Deploy all three Edge Functions: `create-upload`, `signed-media`, and `verify-captcha`.
5. Configure Edge Function secrets: `SITE_ORIGIN` (exact deployed HTTPS origin), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (only where needed by the existing upload/playback functions), and `TURNSTILE_SECRET_KEY`. Keep all secrets in Supabase, not GitHub.
6. Add the production hostname in Cloudflare Turnstile and use its site key in the frontend config.
7. Host the static frontend on Cloudflare Pages or another HTTPS static host. Keep `supabase-config.js` untracked; `.gitignore` already excludes it.
8. Test admin access, RLS, CAPTCHA failure/success, private-media access, upload limits, expired signed links, and load before sharing publicly.

## Hosting and scaling
Use dedicated object/video storage and a CDN for media. GitHub is for source code, not movie hosting. Large-scale streaming needs transcoding (HLS/DASH), egress capacity, CDN/WAF/rate limits, monitoring, backups, and budget alerts. A CAPTCHA is an abuse-reduction layer, not a substitute for authorization or rate limiting. Public pages should remain crawlable; request indexing after deploying your domain.
