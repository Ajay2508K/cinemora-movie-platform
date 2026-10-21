# Authorized catalogue and playback

Cinemora can list metadata separately from playback. The series manager at `/series-admin.html` records a series as a Web Series catalogue item, then stores seasons, episode metadata, publication state, and an authorized playback link for each episode.

## Source rules

- Use a provider's official API or a catalog you control for metadata synchronization. Keep provider credentials in a server-side secret store; never put them in browser code.
- Metadata rights do not grant streaming rights. Set an episode's playback URL only when Cinemora owns the content or has permission to embed/distribute it.
- The manager accepts YouTube, Google Drive viewer, and direct HTTPS MP4/WebM/HLS URLs. Playback stays on the source host; Cinemora does not download or rehost linked videos.
- Do not scrape NetMirror, copy its catalog or artwork, bypass DRM/paywalls, or link to unauthorized streams.
- Use original or properly licensed artwork. The homepage spotlight uses Cinemora's original scalable vector artwork at `/assets/cinemora-spotlight.svg`; a movie poster is no longer stretched into the hero banner.
- For uploaded movies, the existing private Supabase bucket and short-lived signed URLs remain the playback path. Full-length files exceed the current 50 MiB upload cap; use a licensed video CDN/storage plan before increasing it.

## Setup and rollout

Apply `supabase/migrations/20261021090000_series_seasons_episodes.sql` to the Cinemora Supabase project before using the new episode manager. It adds seasons and episodes with row-level security. Public playback listings require a published series and published episode; paid-series rows also require an active Plus subscription. Admins continue to manage drafts.

No external catalog provider or stream rights credentials are included in the repository. Automatic metadata synchronization requires a specific authorized provider and its API credentials. This implementation adds the data model and admin workflow, not a NetMirror importer.
