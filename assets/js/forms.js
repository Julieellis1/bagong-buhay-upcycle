import { $$, EMAIL_RE } from "./util.js";
/** Inline validation shared by all Netlify forms. Returns true when the given scope is valid. */
export function validate(scope) {
  let first = null;
  const groups = new Set();
  for (const el of $$("input,select,textarea", scope)) {
    if (el.type === "hidden" || el.name === "bot-field" || el.closest("[hidden]")) continue;
    let msg = "";
    if (el.type === "radio") {
      if (groups.has(el.name)) continue; groups.add(el.name);
      const any = $$(`input[name="${el.name}"]`, scope).some((r) => r.checked);
      if (el.required && !any) msg = "Pick one option.";
      setErr(scope, el.name, msg, $$(`input[name="${el.name}"]`, scope));
      if (msg && !first) first = el; continue;
    }
    const v = (el.value || "").trim();
    if (el.type === "checkbox") { if (el.required && !el.checked) msg = "Please tick this box to join."; }
    else if (el.required && !v) msg = "This one’s needed.";
    else if (el.type === "email" && v && !EMAIL_RE.test(v)) msg = "That email doesn’t look right.";
    else if (el.tagName === "TEXTAREA" && el.required && v.length < 10) msg = "A sentence or so, please.";
    setErr(scope, el.name, msg, [el]);
    if (msg && !first) first = el;
  }
  if (first) first.focus();
  return !first;
}
function setErr(scope, name, msg, els) {
  const box = scope.querySelector(`[data-error-for="${name}"]`);
  for (const e of els) { e.setAttribute("aria-invalid", msg ? "true" : "false"); if (box) { box.id = box.id || `err-${name}-${Math.random().toString(36).slice(2, 7)}`; msg ? e.setAttribute("aria-errormessage", box.id) : e.removeAttribute("aria-errormessage"); } }
  if (box) { box.textContent = msg; box.hidden = !msg; }
}
export function initForms() {
  for (const f of $$("form[data-netlify]")) {
    if (f.dataset.form === "intake") continue; // wizard handles its own steps
    f.addEventListener("submit", (e) => { if (!validate(f)) e.preventDefault(); });
  }
}
