import { $, $$ } from "./util.js";
/** Filter chips + forgiving search + "ask about this piece" dialog. */
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
// tiny edit-distance so "denium" still finds "denim"
function near(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; continue; } if (++edits > 1) return false; if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; } }
  return edits + (a.length - i) + (b.length - j) <= 1;
}
const matches = (hay, term) => hay.includes(term) || (term.length >= 4 && hay.split(/[^a-z0-9]+/).some((w) => near(w, term)));

export function init() {
  const root = $("#pieces"); const cards = $$(".piece-card", root); const chips = $$("[data-filter]", root);
  const q = $("#piece-search"); const count = $("[data-count]"); const empty = $("[data-empty]");
  let cat = new URLSearchParams(location.search).get("cat") || "all";
  const run = () => {
    const terms = norm(q.value || "").trim().split(/\s+/).filter(Boolean);
    let n = 0;
    for (const c of cards) { const ok = (cat === "all" || c.dataset.cat === cat) && terms.every((t) => matches(c.dataset.search, t)); c.hidden = !ok; if (ok) n++; }
    chips.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === cat)));
    count.textContent = `${n} piece${n === 1 ? "" : "s"}`; empty.hidden = n > 0;
  };
  chips.forEach((b) => b.addEventListener("click", () => { cat = b.dataset.filter; const u = new URL(location); cat === "all" ? u.searchParams.delete("cat") : u.searchParams.set("cat", cat); history.replaceState(null, "", u); run(); }));
  q.addEventListener("input", run);
  run();

  const dlg = $("#ask-dialog"); if (!dlg) return;
  let opener = null;
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-ask]"); if (!b) return;
    opener = b; dlg.querySelector("input[name=piece]").value = b.dataset.ask;
    $("[data-ask-label]", dlg).textContent = b.dataset.askName;
    dlg.showModal(); dlg.querySelector("input:not([type=hidden]):not([name=bot-field])")?.focus();
  });
  dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-close]")) dlg.close(); });
  dlg.addEventListener("close", () => opener?.focus());
  // open from deep link #slug?ask
  if (location.hash && new URLSearchParams(location.search).has("ask")) document.querySelector(`[data-ask="${CSS.escape(location.hash.slice(1))}"]`)?.click();
}
