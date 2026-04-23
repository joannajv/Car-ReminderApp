(() => {
  const TRANSITION_KEY = "car-demo-page-transition-direction";
  const EXIT_DURATION_MS = 380;
  const ENTER_CLEANUP_MS = 420;

  const isInternalNavigableLink = (anchor) => {
    if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return false;
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
    try {
      const url = new URL(anchor.href, window.location.href);
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  };

  const inferDirection = (anchor) => {
    const explicit = (anchor.getAttribute("data-nav-direction") || "").toLowerCase();
    if (explicit === "back" || explicit === "forward") return explicit;
    const ariaLabel = (anchor.getAttribute("aria-label") || "").toLowerCase();
    const className = (anchor.className || "").toString().toLowerCase();
    if (ariaLabel.includes("back") || className.includes("back")) return "back";
    return "forward";
  };

  const runEnterAnimation = () => {
    const direction = sessionStorage.getItem(TRANSITION_KEY) || "forward";
    sessionStorage.removeItem(TRANSITION_KEY);
    document.body.classList.add(`page-enter-${direction}`);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.body.classList.add("page-enter-active");
      });
    });

    window.setTimeout(() => {
      document.body.classList.remove("page-enter-forward", "page-enter-back", "page-enter-active");
    }, ENTER_CLEANUP_MS);
  };

  const ensureMotionLayer = () => {
    const screen = document.querySelector(".screen");
    if (!screen) return;
    if (screen.firstElementChild && screen.firstElementChild.classList.contains("screen-motion-layer")) return;

    const layer = document.createElement("div");
    layer.className = "screen-motion-layer";
    while (screen.firstChild) {
      layer.appendChild(screen.firstChild);
    }
    screen.appendChild(layer);
  };

  const navigateWithExit = (anchor, direction) => {
    sessionStorage.setItem(TRANSITION_KEY, direction);
    document.body.classList.add("page-exiting", `page-exit-${direction}`);
    window.setTimeout(() => {
      window.location.href = anchor.href;
    }, EXIT_DURATION_MS);
  };

  document.addEventListener("DOMContentLoaded", () => {
    ensureMotionLayer();
    runEnterAnimation();

    document.addEventListener("click", (event) => {
      const anchor = event.target.closest("a");
      if (!isInternalNavigableLink(anchor)) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      navigateWithExit(anchor, inferDirection(anchor));
    });
  });
})();
