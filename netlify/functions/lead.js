/**
 * POST /.netlify/functions/lead
 * Validates + sanitizes a form submission and forwards it as JSON to LEAD_WEBHOOK_URL
 * (Zapier / Make / HubSpot / Airtable / any CRM webhook).
 *
 * Env vars (Netlify → Site settings → Environment variables):
 *   LEAD_WEBHOOK_URL     required  — where clean leads are POSTed
 *   LEAD_WEBHOOK_SECRET  optional  — sent as X-Lead-Secret so the receiver can verify the source
 *   ALLOWED_ORIGIN       optional  — e.g. https://bagongbuhay.example (defaults to the site URL)
 *
 * Tip: rename/duplicate this file as `submission-created.js` to have Netlify call it
 * automatically for every verified Netlify Forms submission (payload in body.payload.data).
 */
const FORMS = new Set(["contact", "intake", "hold", "droplist"]);
const TOPICS = new Set(["hello", "piece", "upcycle", "market", "collab", "other"]);
const LIMITS = { message: 5000, details: 5000, default: 300 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const clean = (v, max) => String(v ?? "")
  .replace(/<[^>]*>/g, "")
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
  .replace(/[ \t]+/g, " ")
  .trim()
  .slice(0, max);

const json = (status, body, origin) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin, "Vary": "Origin", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  const origin = process.env.ALLOWED_ORIGIN || process.env.URL || "*";
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type" } };
  if (event.httpMethod !== "POST") return json(405, { ok: false, error: "method_not_allowed" }, origin);
  if ((event.body || "").length > 20000) return json(413, { ok: false, error: "too_large" }, origin);

  let raw = {};
  try {
    const type = event.headers["content-type"] || "";
    if (type.includes("application/json")) {
      raw = JSON.parse(event.body || "{}");
      if (raw.payload && raw.payload.data) raw = { ...raw.payload.data, "form-name": raw.payload.form_name }; // submission-created event
    } else raw = Object.fromEntries(new URLSearchParams(event.body || ""));
  } catch { return json(400, { ok: false, error: "bad_body" }, origin); }

  if (raw["bot-field"]) return json(200, { ok: true }, origin); // honeypot: pretend success, drop it

  const form = clean(raw["form-name"], 40);
  if (!FORMS.has(form)) return json(400, { ok: false, error: "unknown_form" }, origin);
  const data = {};
  for (const [k, v] of Object.entries(raw)) {
    if (["bot-field", "form-name"].includes(k)) continue;
    if (!/^[a-zA-Z][\w-]{0,40}$/.test(k)) continue;
    data[k] = clean(v, LIMITS[k] || LIMITS.default);
  }
  const errors = [];
  if (!EMAIL_RE.test(data.email || "")) errors.push("email");
  if (form === "contact") { if (!data.name) errors.push("name"); if ((data.message || "").length < 10) errors.push("message"); if (data.topic && !TOPICS.has(data.topic)) errors.push("topic"); }
  if (form === "intake") { for (const f of ["name", "garment", "goal"]) if (!data[f]) errors.push(f); if ((data.details || "").length < 10) errors.push("details"); }
  if (form === "hold") { for (const f of ["name", "piece"]) if (!data[f]) errors.push(f); }
  if (form === "droplist" && data.consent !== "yes") errors.push("consent"); // CAN-SPAM: opt-in recorded; every send needs unsubscribe + postal address
  if (errors.length) return json(422, { ok: false, errors }, origin);

  const lead = {
    form, receivedAt: new Date().toISOString(), source: process.env.URL || "atelierbycafe.ca",
    consent: { marketing: form === "droplist" ? data.consent === "yes" : data.newsletter === "yes", capturedAt: new Date().toISOString(), wording: "Express opt-in checkbox (unticked by default)" },
    data,
  };
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return json(202, { ok: true, forwarded: false, note: "LEAD_WEBHOOK_URL not set" }, origin);
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...(process.env.LEAD_WEBHOOK_SECRET ? { "X-Lead-Secret": process.env.LEAD_WEBHOOK_SECRET } : {}) }, body: JSON.stringify(lead) });
    if (!res.ok) throw new Error(`webhook ${res.status}`);
    return json(200, { ok: true, forwarded: true }, origin);
  } catch (e) {
    console.error("lead forward failed", e.message);
    return json(502, { ok: false, error: "forward_failed" }, origin);
  }
};
