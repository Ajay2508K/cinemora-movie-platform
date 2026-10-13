# Cinemora production security

## Status
The current index.html is a static demo. The SQL and Edge Functions in this branch are a security-oriented backend scaffold and are NOT live until deployed to your own Supabase project and wired into the UI. No public website can be guaranteed impossible to attack or able to handle unlimited traffic.

## Architecture
- Static frontend hosted on Cloudflare Pages or a suitable static host.
- Supabase Auth, Postgres RLS, private Storage bucket.
- Admin-only Edge Function issues signed upload URLs; a separate function returns short-lived playback URLs for published titles.
- For real concurrent streaming, use a dedicated video platform/transcoding pipeline and CDN, plus WAF/rate limiting. Do not put video payloads in GitHub.

## Setup
1. Create a Supabase project. Enable email/password auth; turn off public sign-up if only the owner should administer uploads.
2. Run supabase/schema.sql in Supabase SQL Editor.
3. Create your account in Supabase Auth, then uncomment and execute the admin bootstrap SQL at the bottom of schema.sql using your actual email.
4. Deploy both Edge Functions. Set server secrets SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY and SITE_ORIGIN to the exact deployed site origin. The service-role key must never appear in browser code or Git.
5. Wire frontend to Supabase Auth/catalogue/signed upload/signed playback. Do not treat the current localStorage demo form as a secure admin upload.
6. Add real server-side upload quotas, MIME/content sniffing, malware scanning, transcoding, per-user/IP rate limits, CDN/WAF/bot mitigation, monitoring, backups, spend alerts, and security headers.
7. Test unauthorized upload, privilege escalation, unpublished-media access, invalid file types, oversized files, expired links, RLS, and concurrent load before production.
8. Only distribute content you own or have permission to share.

## Scale notes
GitHub Pages is a static host, not a video origin; its published site limit is 1 GB and its soft bandwidth limit is 100 GB/month. Provider quotas and egress vary. A free tier cannot promise large-scale streaming. Storage's declared MIME type is not proof of file contents, so inspect and transcode uploaded media before publishing.
