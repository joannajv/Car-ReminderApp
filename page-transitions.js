(() => {
  const TRANSITION_KEY = "car-demo-page-transition-direction";
  const DURATION = 240;

  const isInternalLink = (a) => {
    if (!a) return false;
    if (a.target === "_blank" || a.hasAttribute("download")) return false;

    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;

    try {
      const url = new URL(a.href, window.location.href);
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  };

  const getDirection = (a) => {
    const d = (a.getAttribute("data-nav-direction") || "").toLowerCase();
    if (d === "back") return "back";
    return "forward";
  };

  const setupReminders = () => {
    document.querySelectorAll(".reminder-dot").forEach((dot) => {
      dot.onclick = () => {
        const state = dot.getAttribute("aria-pressed") === "true";
        dot.setAttribute("aria-pressed", String(!state));
        dot.classList.toggle("is-complete", !state);
      };
    });
  };

  const ensureLayer = () => {
    const screen = document.querySelector(".screen");
    if (!screen) return;

    if (!screen.querySelector(".screen-motion-layer")) {
      const layer = document.createElement("div");
      layer.className = "screen-motion-layer";

      while (screen.firstChild) {
        layer.appendChild(screen.firstChild);
      }

      screen.appendChild(layer);
    }
  };

  const runEnter = (dir) => {
    document.body.classList.add(`page-enter-${dir}`);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.add("page-enter-active");
      });
    });

    setTimeout(() => {
      document.body.classList.remove(
        "page-enter-forward",
        "page-enter-back",
        "page-enter-active"
      );
    }, DURATION);
  };

  const navigate = (a, dir) => {
    sessionStorage.setItem(TRANSITION_KEY, dir);
    document.body.classList.add("page-exiting", `page-exit-${dir}`);
    setTimeout(() => {
      window.location.href = a.href;
    }, DURATION);
  };

  document.addEventListener("DOMContentLoaded", () => {
    ensureLayer();
    setupReminders();
    const direction = sessionStorage.getItem(TRANSITION_KEY) || "forward";
    sessionStorage.removeItem(TRANSITION_KEY);
    runEnter(direction);

    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!isInternalLink(a)) return;

      e.preventDefault();
      navigate(a, getDirection(a));
    });
  });
})();
