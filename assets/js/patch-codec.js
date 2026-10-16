/** Compact, URL-safe encoding of a patch plan: g|stitch|shape.fabric.x.y;... */
export const GARMENTS = ["tote", "jacket", "top", "skirt"];
export function encodePlan(p) {
  const s = [p.garment, p.stitch, p.patches.map((x) => [x.shape, x.fabric, Math.round(x.x), Math.round(x.y)].join(".")).join(";")].join("|");
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function decodePlan(str) {
  try {
    const s = decodeURIComponent(escape(atob(str.replace(/-/g, "+").replace(/_/g, "/"))));
    const [garment, stitch, list] = s.split("|");
    if (!GARMENTS.includes(garment)) return null;
    const patches = (list ? list.split(";") : []).slice(0, 6).map((t) => { const [shape, fabric, x, y] = t.split("."); return { shape: Number(shape), fabric: Number(fabric), x: clamp(+x), y: clamp(+y) }; })
      .filter((p) => Number.isInteger(p.shape) && Number.isInteger(p.fabric));
    return { garment, stitch: String(stitch).slice(0, 40), patches };
  } catch { return null; }
}
const clamp = (n) => Math.max(0, Math.min(100, Number.isFinite(n) ? n : 50));
export const SHAPES = ["Circle", "Square", "Heart", "Cucumber", "Star", "Scrap (freeform)"];
export const FABRICS = ["Denim scrap", "Kimono remnant", "Floral cotton", "Canvas"];
export function describePlan(p) {
  if (!p.patches.length) return `${p.garment}, no patches placed yet`;
  const counts = {}; for (const x of p.patches) { const k = `${(SHAPES[x.shape] || "patch").toLowerCase()} in ${(FABRICS[x.fabric] || "scrap").toLowerCase()}`; counts[k] = (counts[k] || 0) + 1; }
  return `${p.garment}: ${Object.entries(counts).map(([k, n]) => `${n} × ${k}`).join(", ")}, ${p.stitch.toLowerCase()}`;
}
