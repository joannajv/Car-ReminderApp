/**
 * Home reminder dots only.
 */
(() => {
  const setupReminders = () => {
    document.querySelectorAll(".reminder-dot").forEach((dot) => {
      dot.onclick = () => {
        const state = dot.getAttribute("aria-pressed") === "true";
        dot.setAttribute("aria-pressed", String(!state));
        dot.classList.toggle("is-complete", !state);
      };
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupReminders);
  } else {
    setupReminders();
  }
})();
