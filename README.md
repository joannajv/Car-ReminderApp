# Car-ReminderApp

## Push notifications starter

This repo now includes a starter scaffold for web push reminders:

- Browser push permission + subscription capture in `settings.html`
- Service worker at `car-demo-sw.js`
- Subscription helper logic in `notifications.js`
- SQL schema updates in `supabase-schema.sql`
- Edge function scaffolds:
  - `supabase/functions/send-test-notification`
  - `supabase/functions/send-due-reminders`

### 1) Apply SQL changes

Run `supabase-schema.sql` in your Supabase SQL editor.

### 2) Generate VAPID keys

Generate a VAPID keypair and set:

- `CAR_DEMO_VAPID_PUBLIC_KEY` in `supabase-config.js` (public key)
- Edge Function secrets for private key in Supabase (for final delivery implementation)

### 3) Deploy Edge functions

Deploy:

- `send-test-notification`
- `send-due-reminders`

From the app, open `settings.html` and tap:

- **Enable Phone Notifications**
- **Send Test Notification**

### 4) Real delivery enabled

Edge functions now perform real Web Push send with VAPID keys:

- Dead endpoints (HTTP 404/410) are automatically disabled.
- Delivery attempts are logged in `notification_dispatch_log`.

### 5) Schedule due reminders

Create a Supabase scheduled job to call `send-due-reminders` every minute.

To make scheduling reliable, set `reminders.notify_at` when creating reminders.

### iPhone saved-to-home-screen behavior

For iOS, web push only works when:

1. The app is added to home screen from Safari.
2. The app is opened from that home-screen icon.
3. Notifications are enabled from the in-app Settings screen.

