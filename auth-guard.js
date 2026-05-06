(async function guardRoute() {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const currentPage = pathParts.length ? pathParts[pathParts.length - 1] : "index.html";
  const publicPages = new Set(["login.html", "create-account.html"]);

  if (publicPages.has(currentPage)) {
    if (window.getCarDemoSession) {
      const session = await window.getCarDemoSession();
      if (session) {
        window.location.replace("/index.html");
      }
    }
    return;
  }

  if (window.requireCarDemoAuth) {
    const authLanding = currentPage === "index.html" ? "/splash.html" : "/login.html";
    await window.requireCarDemoAuth(authLanding);
  }
})();
