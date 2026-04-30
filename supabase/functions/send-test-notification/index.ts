import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

type SubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT");
    if (!supabaseUrl || !serviceRoleKey || !anonKey || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      return json(500, { error: "Missing required Supabase env vars." });
    }
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return json(401, { error: "Unauthorized." });
    }

    const { data: subscriptions, error: subError } = await adminClient
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .eq("user_id", user.id)
      .eq("enabled", true);
    if (subError) {
      return json(500, { error: subError.message });
    }
    if (!subscriptions?.length) {
      return json(400, { error: "No active push subscriptions for user." });
    }

    const payload = JSON.stringify({
      title: "Car Reminder",
      body: "This is a test reminder notification.",
      url: "/settings.html",
    });

    const activeSubscriptions = subscriptions as SubscriptionRow[];
    let sent = 0;
    let disabled = 0;

    for (const row of activeSubscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth },
          },
          payload,
          { TTL: 60 }
        );
        sent += 1;
      } catch (error) {
        const statusCode = Number((error as { statusCode?: number })?.statusCode || 0);
        if (statusCode === 404 || statusCode === 410) {
          await adminClient
            .from("push_subscriptions")
            .update({ enabled: false, last_seen_at: new Date().toISOString() })
            .eq("id", row.id);
          disabled += 1;
        }
      }
    }

    const { error: logError } = await adminClient.from("notification_dispatch_log").insert({
      user_id: user.id,
      reminder_id: null,
      channel: "web_push",
      title: "Car Reminder (test)",
      body: `Sent ${sent}/${activeSubscriptions.length} test push payload(s). Disabled ${disabled} expired subscription(s).`,
    });
    if (logError) {
      return json(500, { error: logError.message });
    }

    return json(200, {
      ok: true,
      sent,
      disabled,
      total: activeSubscriptions.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return json(500, { error: message });
  }
});
