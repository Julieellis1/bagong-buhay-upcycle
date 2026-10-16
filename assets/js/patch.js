import { $, $$, rootRel } from "./util.js";
import { encodePlan, decodePlan, describePlan, SHAPES } from "./patch-codec.js";
const SHAPE_CLS = ["circle", "square", "heart", "cucumber", "star", "scrap"];
const MAX = 6;
export function init() {
  const root = $("[data-patch-studio]"); const board = $("[data-board-area]", root); const layer = $("[data-layer]", root);
  const status = $("[data-board-status]", root); const cross = $("[data-crosshair]", root); const stitch = $("[data-stitch]", root);
  const st = { garment: "tote", stitch: stitch.value, shape: 0, fabric: 0, patches: [] };
  const cx = { x: 50, y: 50 };
  const pick = (attr, key, map) => $$(`[${attr}]`, root).forEach((b, idx) => b.addEventListener("click", () => {
    $$(`[${attr}]`, root).forEach((o) => o.setAttribute("aria-pressed", String(o === b))); st[key] = map ? map(b, idx) : idx; if (key === "garment") showGarment(); draw();
  }));
  pick("data-garment", "garment", (b) => b.dataset.garment); pick("data-shape", "shape"); pick("data-fabric", "fabric");
  stitch.addEventListener("change", () => { st.stitch = stitch.value; draw(); });
  const showGarment = () => $$("[data-board]", root).forEach((g) => (g.hidden = g.dataset.board !== st.garment));
  const place = (x, y) => {
    if (st.patches.length >= MAX) { status.textContent = `That’s ${MAX} patches, the most this planner holds. Undo one to move it.`; return; }
    st.patches.push({ shape: st.shape, fabric: st.fabric, x, y }); draw();
  };
  const draw = () => {
    layer.replaceChildren(...st.patches.map((p) => { const d = document.createElement("span"); d.className = `placed shape-${SHAPE_CLS[p.shape]} fab-${p.fabric}`; d.style.left = p.x + "%"; d.style.top = p.y + "%"; return d; }));
    status.textContent = st.patches.length ? `${st.patches.length} patch${st.patches.length > 1 ? "es" : ""}: ${describePlan(st)}` : "No patches yet.";
    const code = encodePlan(st); $("[data-send]", root).href = rootRel("/upcycle/") + `?patch=${code}`;
    history.replaceState(null, "", `?plan=${code}`);
  };
  board.addEventListener("click", (e) => { const r = board.getBoundingClientRect(); place(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100); });
  const moveCross = () => { cross.style.left = cx.x + "%"; cross.style.top = cx.y + "%"; };
  board.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 10 : 4; const k = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (k) { e.preventDefault(); cx.x = Math.max(4, Math.min(96, cx.x + k[0])); cx.y = Math.max(4, Math.min(96, cx.y + k[1])); moveCross(); }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); place(cx.x, cx.y); }
  });
  moveCross();
  $("[data-undo]", root).addEventListener("click", () => { st.patches.pop(); draw(); });
  $("[data-clear]", root).addEventListener("click", () => { st.patches = []; draw(); });
  $("[data-share]", root).addEventListener("click", async (e) => {
    const url = location.href; try { await navigator.clipboard.writeText(url); e.currentTarget.textContent = "Link copied"; } catch { prompt("Copy this link", url); }
  });
  // restore a shared plan
  const shared = new URLSearchParams(location.search).get("plan");
  const p = shared && decodePlan(shared);
  if (p) { Object.assign(st, { garment: p.garment, patches: p.patches }); if ([...stitch.options].some((o) => o.text === p.stitch)) { stitch.value = p.stitch; st.stitch = p.stitch; }
    $$("[data-garment]", root).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.garment === p.garment))); showGarment(); }
  draw();
}
export { SHAPES };
