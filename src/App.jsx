// ═══════════════════════════════════════════════════════════════════════════
// SUPABASE EDGE FUNCTION: zoom-proxy
// Handles Zoom API calls server-side to avoid browser CORS restrictions.
//
// DEPLOY INSTRUCTIONS:
// 1. In your project terminal (or Supabase dashboard → Edge Functions):
//    supabase functions new zoom-proxy
// 2. Replace the contents of supabase/functions/zoom-proxy/index.ts with this file
// 3. Deploy: supabase functions deploy zoom-proxy
//
// Or via Supabase Dashboard:
// → Edge Functions → New Function → name: zoom-proxy → paste this code → Deploy
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  try {
    const { action, accountId, clientId, clientSecret, agentEmail, topic, startTime, duration } = await req.json();

    // ── Step 1: Get Zoom access token ──────────────────────────────────────
    const creds = btoa(`${clientId}:${clientSecret}`);
    const tokenRes = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${creds}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return new Response(
        JSON.stringify({ error: tokenData.reason || "Failed to get Zoom token" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // ── Action: token only (for connection test) ───────────────────────────
    if (action === "token") {
      return new Response(
        JSON.stringify({ access_token: tokenData.access_token }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // ── Action: create_meeting ─────────────────────────────────────────────
    if (action === "create_meeting") {
      const userId = agentEmail || "me";
      const meetingRes = await fetch(
        `https://api.zoom.us/v2/users/${encodeURIComponent(userId)}/meetings`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${tokenData.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic:      topic || "ClearCRM Call",
            type:       startTime ? 2 : 1,   // 2 = scheduled, 1 = instant
            start_time: startTime || undefined,
            duration:   duration  || 60,
            timezone:   "Europe/Dublin",
            settings: {
              join_before_host: true,
              waiting_room:     false,
              auto_recording:   "none",
              mute_upon_entry:  false,
            },
          }),
        }
      );

      const meeting = await meetingRes.json();

      if (!meeting.join_url) {
        return new Response(
          JSON.stringify({ error: meeting.message || "Failed to create Zoom meeting" }),
          { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          join_url:  meeting.join_url,
          start_url: meeting.start_url,
          id:        meeting.id,
          topic:     meeting.topic,
        }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
