import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

type DueReminder = {
  id: string;
  user_id: string;
  text: string;
  notify_at: string;
};

type SubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

const json = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async () => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT");
    if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      return json(500, { error: "Missing required Supabase env vars." });
    }
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const nowIso = new Date().toISOString();

    // Query reminders that are due and not previously sent.
    const { data: reminders, error: dueError } = await adminClient
      .from("reminders")
      .select("id,user_id,text,notify_at")
      .is("notified_at", null)
      .eq("completed", false)
      .not("notify_at", "is", null)
      .lte("notify_at", nowIso)
      .limit(100);
    if (dueError) {
      return json(500, { error: dueError.message });
    }

    const due = (reminders || []) as DueReminder[];
    if (!due.length) {
      return json(200, { ok: true, sent: 0, message: "No due reminders." });
    }

    let sentReminders = 0;
    let deliveredPushes = 0;
    let disabledSubscriptions = 0;

    for (const reminder of due) {
      const { data: subscriptions, error: subError } = await adminClient
        .from("push_subscriptions")
        .select("id,endpoint,p256dh,auth")
        .eq("user_id", reminder.user_id)
        .eq("enabled", true);
      if (subError) {
        continue;
      }
      if (!subscriptions?.length) {
        continue;
      }

      const body = `Reminder: ${reminder.text}`;
      const payload = JSON.stringify({
        title: "Car Reminder",
        body,
        url: "/index.html",
      });

      let reminderDelivered = 0;
      for (const row of subscriptions as SubscriptionRow[]) {
        try {
          await webpush.sendNotification(
            {
              endpoint: row.endpoint,
              keys: { p256dh: row.p256dh, auth: row.auth },
            },
            payload,
            { TTL: 60 }
          );
          reminderDelivered += 1;
          deliveredPushes += 1;
        } catch (error) {
          const statusCode = Number((error as { statusCode?: number })?.statusCode || 0);
          if (statusCode === 404 || statusCode === 410) {
            await adminClient
              .from("push_subscriptions")
              .update({ enabled: false, last_seen_at: new Date().toISOString() })
              .eq("id", row.id);
            disabledSubscriptions += 1;
          }
        }
      }

      if (reminderDelivered < 1) {
        continue;
      }

      await adminClient.from("notification_dispatch_log").insert({
        user_id: reminder.user_id,
        reminder_id: reminder.id,
        channel: "web_push",
        title: "Car Reminder",
        body,
      });

      await adminClient
        .from("reminders")
        .update({ notified_at: nowIso })
        .eq("id", reminder.id)
        .is("notified_at", null);

      sentReminders += 1;
    }

    return json(200, {
      ok: true,
      processed: due.length,
      sent_reminders: sentReminders,
      delivered_pushes: deliveredPushes,
      disabled_subscriptions: disabledSubscriptions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return json(500, { error: message });
  }
});
