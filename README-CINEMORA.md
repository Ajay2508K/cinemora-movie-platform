# Cinemora project notes

Cinemora is a responsive catalogue and streaming interface for authorized content.

- Public landing: `index.html`
- Live catalogue and playback UI: `catalog.html`
- Admin login and content manager: `admin.html`
- Supabase database and RLS: `supabase/schema.sql`
- Upload, signed playback, and CAPTCHA Edge Functions: `supabase/functions/`
- Deployment instructions: `SECURITY-DEPLOYMENT.md`
- Security test checklist: `SECURITY-TEST-PLAN.md`

## Current status
The code is committed to GitHub, but it is **not deployed or fully configured**. It requires a Supabase project, admin account, Edge Function secrets, a Cloudflare Turnstile site/secret key, frontend configuration, and HTTPS hosting. CAPTCHA only reduces automated abuse; the public catalogue remains public by design. No actual penetration or load test has been run.

Never commit `supabase-config.js`, service-role credentials, Turnstile secret keys, or movie files. Distribute only content you own or have explicit distribution rights for.
