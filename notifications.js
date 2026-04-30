(function initCarDemoNotifications() {
  const SW_PATH = "/car-demo-sw.js";

  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const getSubscriptionRow = (userId, subscription) => {
    const keyData = subscription.toJSON().keys || {};
    return {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: keyData.p256dh || "",
      auth: keyData.auth || "",
      enabled: true,
      user_agent: navigator.userAgent || "",
      last_seen_at: new Date().toISOString(),
    };
  };

  const ensureSwRegistration = async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service workers are not supported on this browser.");
    }
    await navigator.serviceWorker.register(SW_PATH);
    // Wait until there is an active worker before accessing PushManager.
    return navigator.serviceWorker.ready;
  };

  const ensurePermission = async () => {
    if (!("Notification" in window)) {
      throw new Error("Notifications are not supported on this browser.");
    }
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") {
      throw new Error("Notifications are blocked in browser settings.");
    }
    return Notification.requestPermission();
  };

  const ensurePushSubscription = async () => {
    if (!window.isSecureContext) {
      throw new Error("Push requires HTTPS (or localhost).");
    }
    if (!("PushManager" in window)) {
      throw new Error("Push is not supported in this browser context.");
    }
    if (!window.carDemoSupabase) {
      throw new Error("Supabase client not available.");
    }
    const session = await window.getCarDemoSession?.();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Please log in first.");
    }
    if (!window.CAR_DEMO_VAPID_PUBLIC_KEY || window.CAR_DEMO_VAPID_PUBLIC_KEY.includes("YOUR")) {
      throw new Error("Set CAR_DEMO_VAPID_PUBLIC_KEY in supabase-config.js.");
    }

    const permission = await ensurePermission();
    if (permission !== "granted") {
      throw new Error("Notification permission was not granted.");
    }

    const registration = await ensureSwRegistration();
    if (!registration.pushManager) {
      throw new Error("Push service is not available in this browser.");
    }
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(window.CAR_DEMO_VAPID_PUBLIC_KEY),
      });
    }

    const row = getSubscriptionRow(userId, subscription);
    const { error } = await window.carDemoSupabase
      .from("push_subscriptions")
      .upsert(row, { onConflict: "endpoint" });
    if (error) throw error;
    return subscription;
  };

  const disablePushSubscription = async () => {
    if (!window.carDemoSupabase) {
      throw new Error("Supabase client not available.");
    }
    const session = await window.getCarDemoSession?.();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Please log in first.");
    }

    const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
    const subscription = await registration?.pushManager?.getSubscription?.();
    if (subscription) {
      await subscription.unsubscribe();
      const { error } = await window.carDemoSupabase
        .from("push_subscriptions")
        .update({ enabled: false, last_seen_at: new Date().toISOString() })
        .eq("endpoint", subscription.endpoint)
        .eq("user_id", userId);
      if (error) throw error;
    }
  };

  const sendTestNotification = async () => {
    if (!window.carDemoSupabase) throw new Error("Supabase client not available.");
    const { error } = await window.carDemoSupabase.functions.invoke("send-test-notification");
    if (error) throw error;
  };

  window.carDemoNotifications = {
    ensurePushSubscription,
    disablePushSubscription,
    sendTestNotification,
  };
})();
