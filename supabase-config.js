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
