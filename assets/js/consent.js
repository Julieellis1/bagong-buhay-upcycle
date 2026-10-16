import { $, store } from "./util.js";
import { PLAUSIBLE_DOMAIN } from "./config.js";
/** Analytics load only after an explicit "Allow". Choice stored as bb-consent. */
function loadAnalytics() {
  if (!PLAUSIBLE_DOMAIN || document.getElementById("pa")) return;
  const s = document.createElement("script"); s.id = "pa"; s.defer = true; s.dataset.domain = PLAUSIBLE_DOMAIN; s.src = "https://plausible.io/js/script.js";
  document.head.appendChild(s);
}
export function initConsent() {
  const bar = $("[data-consent]");
  const c = store.get("bb-consent");
  if (c === "yes") loadAnalytics();
  if (bar && c === null) bar.hidden = false;
  bar?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-consent-choice]"); if (!b) return;
    store.set("bb-consent", b.dataset.consentChoice); bar.hidden = true;
    if (b.dataset.consentChoice === "yes") loadAnalytics();
  });
  document.addEventListener("click", (e) => { if (e.target.closest("[data-consent-reset]")) { store.del("bb-consent"); if (bar) { bar.hidden = false; bar.querySelector("button")?.focus(); } } });
}
