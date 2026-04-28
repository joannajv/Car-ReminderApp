(async function guardRoute() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const publicPages = new Set(["login.html", "create-account.html"]);

  if (publicPages.has(currentPage)) {
    if (window.getCarDemoSession) {
      const session = await window.getCarDemoSession();
      if (session) {
        window.location.href = "index.html";
      }
    }
    return;
  }

  if (window.requireCarDemoAuth) {
    await window.requireCarDemoAuth("login.html");
  }
})();
