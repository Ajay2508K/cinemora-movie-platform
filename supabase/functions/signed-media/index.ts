import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const siteOrigin = Deno.env.get("SITE_ORIGIN") ?? "https://YOUR-SITE-DOMAIN.example";
const headers = {
  "Access-Control-Allow-Origin": siteOrigin,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
  "Cache-Control": "no-store",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });

const fromB64url = (value: string) => {
  const raw = value.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(
    atob(raw + "=".repeat((4 - raw.length % 4) % 4)),
    (char) => char.charCodeAt(0),
  );
};

async function validHumanToken(token: string, site: string, secret: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    if (!await crypto.subtle.verify(
      "HMAC",
      key,
      fromB64url(parts[1]),
      new TextEncoder().encode(parts[0]),
    )) return false;
    const claims = JSON.parse(new TextDecoder().decode(fromB64url(parts[0])));
    return claims.host === new URL(site).hostname && Number(claims.exp) > Date.now();
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const origin = req.headers.get("origin");
  const site = Deno.env.get("SITE_ORIGIN");
  if (!site || origin !== site) return json({ error: "Origin not allowed" }, 403);

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const captchaSecret = Deno.env.get("CAPTCHA_SESSION_SECRET");
  if (!url || !key || !captchaSecret) {
    return json({ error: "Server is not configured" }, 500);
  }

  let body: { movieId?: string; humanToken?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (!body.movieId || !/^[0-9a-f-]{36}$/i.test(body.movieId)) {
    return json({ error: "Invalid title ID" }, 400);
  }
  if (
    !body.humanToken ||
    !await validHumanToken(body.humanToken, site, captchaSecret)
  ) {
    return json({ error: "Complete human verification first" }, 403);
  }

  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: movie, error: movieError } = await db
    .from("movies")
    .select("video_path,published,access_tier,video_source_url,video_source_type")
    .eq("id", body.movieId)
    .maybeSingle();
  if (movieError) return json({ error: "Unable to authorize playback" }, 500);
  if (!movie || !movie.published) return json({ error: "Title not found" }, 404);

  if (movie.access_tier === "plus") {
    const authHeader = req.headers.get("authorization") ?? "";
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) return json({ error: "Plus membership required" }, 403);

    const { data: authData, error: authError } = await db.auth.getUser(match[1]);
    if (authError || !authData.user) return json({ error: "Sign-in required" }, 401);

    const userId = authData.user.id;
    const { data: profile, error: profileError } = await db
      .from("user_profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (profileError) return json({ error: "Unable to authorize playback" }, 500);

    const isAdmin = profile?.role === "admin";
    if (!isAdmin) {
      const { data: subscription, error: subscriptionError } = await db
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "active")
        .gt("current_period_end", new Date().toISOString())
        .limit(1)
        .maybeSingle();
      if (subscriptionError) return json({ error: "Unable to authorize playback" }, 500);
      if (!subscription) return json({ error: "Active Plus membership required" }, 403);
    }
  } else if (movie.access_tier !== "free") {
    return json({ error: "Title not found" }, 404);
  }

  if (movie.video_source_type && movie.video_source_type !== "upload") {
    const raw = movie.video_source_url ?? "";
    let playbackUrl = raw;
    if (movie.video_source_type === "youtube") {
      let videoId = "";
      try {
        const parsed = new URL(raw);
        videoId = parsed.hostname === "youtu.be"
          ? parsed.pathname.split("/").filter(Boolean)[0] ?? ""
          : parsed.searchParams.get("v") ?? parsed.pathname.split("/").filter(Boolean).pop() ?? "";
      } catch { /* rejected below */ }
      if (!videoId || !/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) return json({ error: "Invalid authorized video source" }, 422);
      playbackUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
    } else if (movie.video_source_type === "google_drive") {
      const match = raw.match(/\\/d\\/([^/?#]+)/);
      if (!match || !["drive.google.com", "docs.google.com"].includes(new URL(raw).hostname)) return json({ error: "Invalid authorized video source" }, 422);
      playbackUrl = `https://drive.google.com/file/d/${encodeURIComponent(match[1])}/preview`;
    } else if (movie.video_source_type === "direct") {
      let parsed: URL;
      try { parsed = new URL(raw); } catch { return json({ error: "Invalid authorized video source" }, 422); }
      if (parsed.protocol !== "https:" || !/\\.(mp4|webm|m3u8)$/i.test(parsed.pathname)) return json({ error: "Invalid authorized video source" }, 422);
      playbackUrl = raw;
    } else {
      return json({ error: "Unsupported playback source" }, 422);
    }
    return json({ url: playbackUrl, sourceType: movie.video_source_type, downloadable: false });
  }

  const { data: signed, error: signError } = await db.storage
    .from("cinemora-media")
    .createSignedUrl(movie.video_path, 300, { download: false });
  if (signError || !signed?.signedUrl) {
    return json({ error: "Unable to create playback URL" }, 500);
  }
  return json({ url: signed.signedUrl, expiresIn: 300, sourceType: "upload", downloadable: true });
});
