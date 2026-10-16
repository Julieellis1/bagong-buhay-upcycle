import { $, $$ } from "./util.js";
export function init() {
  const q = $("#faq-search"), items = $$("#faq-list .faq-item"), count = $("[data-faq-count]"), empty = $("[data-faq-empty]");
  const run = () => {
    const terms = (q.value || "").toLowerCase().trim().split(/\s+/).filter(Boolean);
    let n = 0;
    for (const it of items) { const ok = terms.every((t) => it.dataset.q.includes(t)); it.hidden = !ok; if (ok) n++; if (ok && terms.length) it.open = true; if (!terms.length) it.open = false; }
    count.textContent = terms.length ? `${n} of ${items.length} questions` : ""; empty.hidden = n > 0;
  };
  q?.addEventListener("input", run);
  const h = location.hash.slice(1); if (h) { const t = document.getElementById(h); if (t?.tagName === "DETAILS") t.open = true; }
}
