# Cinemora pre-launch security and load test plan

Do not declare production readiness until these checks pass against a staging project.

## Authorization and RLS
- Anonymous visitors can read published titles only.
- Anonymous visitors cannot insert/update/delete titles or read drafts.
- A signed-in viewer cannot issue upload tickets, change titles, or grant themselves admin.
- An admin can upload and manage titles.
- Guessed IDs for unpublished titles never return playback URLs.

## Upload abuse
- Reject missing/expired JWT, non-admin accounts, invalid JSON, wrong Origin, unsupported MIME, zero-byte files and files over the configured limit.
- Verify uploaded objects land in the private bucket under the authenticated admin UID prefix.
- Add server-side file signature inspection, malware scanning and transcoding before publishing. Browser MIME types are not trustworthy.
- Add upload quotas and rate limits. Treat signed upload tokens as bearer credentials.

## Playback and scale
- Test expiry, seeking, interrupted network, mobile playback and recovery from expired URLs.
- Run load tests only against your own staging project and within provider terms and spend limits.
- Monitor errors, storage egress, bandwidth, Edge Function invocations and database usage.
- Put a WAF/CDN with bot mitigation and rate limiting in front. A static site and signed URLs alone are not DDoS protection.

## Release gates
- Verify HTTPS and security headers on the deployed host.
- Test backup and restore, account recovery and admin MFA where available.
- Disable public signup unless required.
- Enable secret scanning; ensure service-role keys never enter source or browser bundles.
- Prepare a rights/takedown and abuse-report process.
