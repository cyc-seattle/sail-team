// Runs before the first paint, so a dark page never flashes light. Keep it in step with src/lib/theme.ts.
(function () {
  var saved = null;
  try {
    saved = localStorage.getItem("sail-team:theme");
  } catch {
    // Storage can be off; follow the device.
  }
  var dark = saved === "dark" || (saved !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
})();
