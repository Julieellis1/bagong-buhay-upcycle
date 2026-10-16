import { $, $$, store, esc } from "./util.js";
import { validate } from "./forms.js";
import { decodePlan, describePlan } from "./patch-codec.js";
/** Four-step upcycle request. Effort guess only, never a price: Kim quotes first. Draft autosaves as bb-intake. */
const EFFORT = {
  "Patch a hole or worn spot": 1, "Add visible mending as decoration": 1, "Make it fit differently": 2, "Turn it into something new": 3, "Not sure — ideas welcome": 2,
};
const GARMENT = { "Jacket": 1, "Dress": 1, "Fabric I want made into something": 1 };
export function init() {
  const form = $("form[data-form=intake]"); const steps = $$(".wizard-step", form);
  const next = $("[data-next]", form), back = $("[data-back]", form), submit = $("[data-submit]", form);
  const bar = $("[data-progress]", form), status = $("[data-step-status]", form), effort = $("[data-effort]"), summary = $("[data-summary]", form);
  let i = 0;
  // restore draft
  const draft = store.get("bb-intake", {});
  for (const [k, v] of Object.entries(draft)) { const els = form.elements[k]; if (!els) continue; if (els instanceof RadioNodeList) { for (const r of els) r.checked = r.value === v; } else if (els.type !== "hidden") els.value = v; }
  // patch plan from the studio
  const plan = new URLSearchParams(location.search).get("patch");
  if (plan) { const p = decodePlan(plan); if (p) { form.elements.patch_plan.value = describePlan(p); $("[data-patch-note]", form).hidden = false; $("[data-patch-text]", form).textContent = describePlan(p);
    const goal = [...form.elements.goal].find((r) => r.value.startsWith("Add visible")); if (goal && !draft.goal) goal.checked = true; } }
  const save = () => { const d = {}; for (const el of form.elements) { if (!el.name || el.name === "bot-field" || el.name === "form-name" || el.type === "hidden") continue; if (el.type === "radio") { if (el.checked) d[el.name] = el.value; } else d[el.name] = el.value; } store.set("bb-intake", d); return d; };
  const level = (d) => {
    if (!d.goal) return "Pick a garment and a goal";
    const s = (EFFORT[d.goal] || 2) + (GARMENT[d.garment] || 0);
    return s <= 1 ? "Light: a small mend" : s === 2 ? "Medium: a proper rework" : "Big: a full remake";
  };
  const render = () => {
    steps.forEach((s, n) => (s.hidden = n !== i));
    back.hidden = i === 0; next.hidden = i === steps.length - 1; submit.hidden = i !== steps.length - 1;
    bar.style.width = `${((i + 1) / steps.length) * 100}%`;
    status.textContent = `Step ${i + 1} of ${steps.length}`;
    const d = save(); effort.textContent = level(d);
    if (i === steps.length - 1) {
      const rows = [["Garment", d.garment], ["Goal", d.goal], ["Patch plan", form.elements.patch_plan.value], ["Timing", d.timing + (d.date_needed ? `, ${d.date_needed}` : "")], ["Effort guess", level(d)]].filter((r) => r[1]);
      summary.innerHTML = `<p class="label">Your request</p><dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl><p class="fine">Kim quotes first. Nothing is charged until you agree.</p>`;
    }
  };
  next.addEventListener("click", () => { if (!validate(steps[i])) return; i++; render(); steps[i].querySelector("h2").setAttribute("tabindex", "-1"); steps[i].querySelector("h2").focus(); });
  back.addEventListener("click", () => { i--; render(); steps[i].querySelector("h2").focus(); });
  form.addEventListener("change", () => { const d = save(); effort.textContent = level(d); });
  form.addEventListener("input", save);
  form.addEventListener("submit", (e) => { if (!validate(steps[i])) e.preventDefault(); });
  render();
}
