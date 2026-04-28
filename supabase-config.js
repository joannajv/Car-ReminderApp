// Configure these two values from your Supabase project settings.
window.CAR_DEMO_SUPABASE_URL =
  window.CAR_DEMO_SUPABASE_URL || "https://ifepjgsbqapaqvbhwusv.supabase.co";
window.CAR_DEMO_SUPABASE_ANON_KEY =
  window.CAR_DEMO_SUPABASE_ANON_KEY || "sb_publishable_MIgv8jTsSSYjKvdLuI1viw_vEW55pmb";

(function initSupabase() {
  const isConfigured =
    window.CAR_DEMO_SUPABASE_URL &&
    window.CAR_DEMO_SUPABASE_ANON_KEY &&
    !window.CAR_DEMO_SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
    !window.CAR_DEMO_SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY");

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase client library not loaded.");
    return;
  }

  if (!isConfigured) {
    console.warn("Set CAR_DEMO_SUPABASE_URL and CAR_DEMO_SUPABASE_ANON_KEY in supabase-config.js");
    return;
  }

  window.carDemoSupabase = window.supabase.createClient(
    window.CAR_DEMO_SUPABASE_URL,
    window.CAR_DEMO_SUPABASE_ANON_KEY
  );
})();

window.requireCarDemoAuth = async function requireCarDemoAuth(redirectTo) {
  if (!window.carDemoSupabase) {
    return null;
  }
  const {
    data: { session },
  } = await window.carDemoSupabase.auth.getSession();
  if (!session && redirectTo) {
    window.location.href = redirectTo;
  }
  return session;
};

window.getCarDemoSession = async function getCarDemoSession() {
  if (!window.carDemoSupabase) {
    return null;
  }
  const {
    data: { session },
  } = await window.carDemoSupabase.auth.getSession();
  return session;
};

window.signOutCarDemo = async function signOutCarDemo(redirectTo) {
  if (!window.carDemoSupabase) {
    return;
  }
  await window.carDemoSupabase.auth.signOut();
  if (redirectTo) {
    window.location.href = redirectTo;
  }
};

window.carDemoFormatTimestamp = function carDemoFormatTimestamp(isoString) {
  if (!isoString) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(isoString));
  } catch {
    return String(isoString);
  }
};

window.carDemoToast = function carDemoToast(message, opts) {
  const options = opts || {};
  const id = "carDemoToast";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.className = "car-demo-toast";
    document.body.appendChild(el);
  }

  el.textContent = message;
  el.classList.toggle("is-error", Boolean(options.isError));
  el.classList.add("is-visible");

  clearTimeout(window.__carDemoToastTimer);
  window.__carDemoToastTimer = setTimeout(() => {
    el.classList.remove("is-visible");
  }, options.durationMs || 1400);
};

window.carDemoConfirm = function carDemoConfirm(message) {
  return new Promise((resolve) => {
    const existing = document.getElementById("carDemoConfirmOverlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "carDemoConfirmOverlay";
    overlay.className = "car-demo-confirm-overlay";

    const dialog = document.createElement("div");
    dialog.className = "car-demo-confirm";

    const msg = document.createElement("p");
    msg.className = "car-demo-confirm-text";
    msg.textContent = message;

    const actions = document.createElement("div");
    actions.className = "car-demo-confirm-actions";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "car-demo-confirm-btn";
    cancelBtn.textContent = "Cancel";

    const okBtn = document.createElement("button");
    okBtn.type = "button";
    okBtn.className = "car-demo-confirm-btn car-demo-confirm-btn--danger";
    okBtn.textContent = "Delete";

    const cleanup = (result) => {
      overlay.remove();
      resolve(result);
    };

    cancelBtn.addEventListener("click", () => cleanup(false));
    okBtn.addEventListener("click", () => cleanup(true));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cleanup(false);
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(okBtn);
    dialog.appendChild(msg);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  });
};
