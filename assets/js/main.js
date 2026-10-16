import { $, $$, store, reduced } from "./util.js";
import { initForms } from "./forms.js";
import { initConsent } from "./consent.js";

// ribbon
const ribbon = $("[data-ribbon]");
if (ribbon) {
  if (document.documentElement.classList.contains("ribbon-hidden")) ribbon.hidden = true;
  $("[data-ribbon-close]", ribbon)?.addEventListener("click", () => { ribbon.hidden = true; try { localStorage.setItem("bb-ribbon", "hidden"); } catch {} });
}
// theme
const tbtn = $("[data-theme-toggle]");
const isDark = () => { const t = document.documentElement.dataset.theme; return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; };
const syncTheme = () => tbtn?.setAttribute("aria-pressed", String(isDark()));
syncTheme();
tbtn?.addEventListener("click", () => { const next = isDark() ? "light" : "dark"; document.documentElement.dataset.theme = next; try { localStorage.setItem("bb-theme", next); } catch {} syncTheme(); });
// nav
const nt = $("[data-nav-toggle]"), nav = $("#site-nav");
if (nt && nav) {
  const set = (open) => { nt.setAttribute("aria-expanded", String(open)); open ? nav.setAttribute("data-open", "") : nav.removeAttribute("data-open"); };
  nt.addEventListener("click", () => set(nt.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && nt.getAttribute("aria-expanded") === "true") { set(false); nt.focus(); } });
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
}
// reveal-on-scroll (progressive; content visible without JS)
if (!reduced() && "IntersectionObserver" in window) {
  const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add("is-in"); io.unobserve(x.target); } }), { rootMargin: "0px 0px -8% 0px" });
  $$(".steps > li, .grid-3 > .patch, .grid-4 > .patch").forEach((el) => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add("reveal"); io.observe(el); } });
}
initForms();
initConsent();
// thanks page: tailor message by form
if ($("[data-thanks-title]")) {
  const f = new URLSearchParams(location.search).get("form");
  const copy = { droplist: ["You’re on the drop list.", "One short email when there’s something new. Unsubscribe any time."],
    hold: ["Hold request sent.", "Kim will reply about the piece. Nothing is reserved or charged until she confirms."],
    intake: ["Your upcycle request is with Kim.", "She reads every one and quotes first. Nothing is charged until you agree."] }[f];
  if (copy) { $("[data-thanks-title]").textContent = copy[0]; $("[data-thanks-body]").textContent = copy[1]; }
  if (f === "intake") store.del("bb-intake");
}
// lazy feature modules
const lazy = [["#pieces", "./pieces.js"], ["form[data-form=intake]", "./intake.js"], ["[data-patch-studio]", "./patch.js"],
  ["#events-upcoming", "./markets.js"], ["[data-map]", "./markets.js"], ["#faq-list", "./faq.js"]];
const done = new Set();
for (const [sel, mod] of lazy) if ($(sel) && !done.has(mod)) { done.add(mod); import(mod).then((m) => m.init?.()); }
