# Cinemora deployment and security guide

## Current status
The code is in GitHub, but this project is **not yet deployed or configured**. It requires external Supabase and Cloudflare Turnstile setup. No penetration or load testing has been completed. Security controls reduce risk but cannot guarantee zero attacks or unlimited traffic.

## Architecture
- Static HTTPS frontend hosted on Cloudflare Pages or a similar host.
- Supabase Auth, Postgres row-level security, and a private Storage bucket.
- Admin-only signed upload flow and short-lived signed playback URLs.
- Cloudflare Turnstile verification through a server-side Edge Function.
- Dedicated video/object storage, transcoding, CDN, WAF and rate limiting for production scale.

## Setup steps
1. Create a Supabase project and run `supabase/schema.sql` in SQL Editor.
2. Create your administrator user in Supabase Auth. Use the bootstrap SQL at the bottom of `schema.sql` to grant that exact account the `admin` role. Do not expose self-registration for admin access.
3. Copy `supabase-config.js.example` to `supabase-config.js`. Set `SUPABASE_URL`, the browser-safe publishable/anon key, and the Cloudflare Turnstile site key. The actual file is ignored by Git.
4. In Cloudflare Turnstile, register the exact production hostname and get a site key and secret key.
5. Deploy the three functions: `create-upload`, `signed-media`, and `verify-captcha`.
6. Set server-side Supabase function secrets. All functions need the correct `SITE_ORIGIN` matching the exact HTTPS origin. The CAPTCHA function needs `TURNSTILE_SECRET_KEY` and a long random `CAPTCHA_SESSION_SECRET` (at least 32 random bytes); the playback function also checks the signed human-verification session. The upload/playback functions need only the server secrets required by their code. Never expose `SUPABASE_SERVICE_ROLE_KEY` or `TURNSTILE_SECRET_KEY` in frontend files.
7. Deploy the static files to HTTPS hosting. Ensure the hosting platform applies the `_headers` security policy and verify the Content Security Policy allows Turnstile.
8. Verify that only published rows appear publicly; an unauthenticated visitor cannot upload, publish, or delete; unpublishing blocks playback; CAPTCHA fails closed when configuration or token verification is missing.
9. Before launch, add rate limits, upload quota enforcement, actual file-content inspection/malware scanning, video transcoding, moderation/takedown workflow, monitoring, backups, budget alerts and WAF/CDN rules.
10. Run the full checklist in `SECURITY-TEST-PLAN.md`.

## Scale and SEO
GitHub stores source code, not movie files. Do not commit video files. For real concurrent streaming, use a video provider/object storage and CDN with HLS/DASH. Free plans have storage, egress, and execution limits; load capacity must be tested against the chosen provider. Keep the landing page crawlable and submit the deployed domain to Google Search Console after launch. A CAPTCHA is not a substitute for authorization, quotas, and rate limiting.

## Content rights
Only upload/distribute films and videos you own or are licensed to distribute. Provide a contact and takedown process before public launch.
