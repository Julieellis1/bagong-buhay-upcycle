import { $, $$, esc, laNow, rootRel } from "./util.js";
import { download } from "./ics.js";
/** Splits /data/events.json into upcoming vs past by Los Angeles time. ?fixture=1 adds a test event 10 days out (QA only). */
const fmt = (iso) => new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
const time = (iso) => new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
const laDate = (iso) => laNow(new Date(iso));
export async function init() {
  initMap();
  const up = $("#events-upcoming"); if (!up) return;
  let events = [];
  try { const r = await fetch(rootRel("/data/events.json"), { cache: "no-cache" }); const d = await r.json(); events = d.items || d; } catch { return; }
  if (new URLSearchParams(location.search).get("fixture") === "1") {
    const s = new Date(Date.now() + 10 * 864e5); s.setUTCHours(18, 0, 0, 0); const e = new Date(s.getTime() + 6 * 36e5);
    events.push({ id: "qa-fixture", name: "QA fixture market (test only)", start: s.toISOString(), end: e.toISOString(), venue: "Test venue", address: "Hillsboro, OR", note: "Shown only with ?fixture=1." });
  }
  const now = laNow();
  const timed = events.filter((e) => String(e.start).includes("T"));
  const upcoming = timed.filter((e) => laDate(e.end || e.start) >= now).sort((a, b) => a.start.localeCompare(b.start));
  if (!upcoming.length) return; // server-rendered "none booked" message stays
  up.innerHTML = `<ol class="events">${upcoming.map((e) => {
    const days = Math.ceil((new Date(e.start) - Date.now()) / 864e5);
    const cd = days > 1 ? `${days} days to go` : days === 1 ? "Tomorrow" : "Happening now";
    const d = new Date(e.start); const mon = d.toLocaleString("en-US", { month: "short", timeZone: "America/Los_Angeles" }); const day = d.toLocaleString("en-US", { day: "numeric", timeZone: "America/Los_Angeles" });
    return `<li class="event event--upcoming patch"><div class="event-date"><span>${mon}</span><strong>${day}</strong><span>${d.getFullYear()}</span></div>
<div><h3 class="h3">${esc(e.name)}</h3><p class="label">${fmt(e.start)} · ${time(e.start)}–${time(e.end || e.start)} PT</p><p class="countdown" data-countdown>${cd}</p>
<p>${esc([e.venue, e.address].filter(Boolean).join(", "))}</p><button type="button" class="btn btn--ghost btn--small" data-ics="${esc(e.id)}">Add to calendar</button></div></li>`;
  }).join("")}</ol>`;
  // past list: drop anything now upcoming
  $$("#events-past .event").forEach((li) => { const h = li.querySelector("h3")?.textContent; if (upcoming.some((u) => u.name === h)) li.remove(); });
  up.addEventListener("click", (ev) => { const b = ev.target.closest("[data-ics]"); if (b) download(upcoming.find((e) => e.id === b.dataset.ics)); });
}
function initMap() {
  for (const slot of $$("[data-map]")) {
    $("[data-load-map]", slot)?.addEventListener("click", (e) => {
      const lat = +slot.dataset.lat, lng = +slot.dataset.lng, d = 0.006;
      const f = document.createElement("iframe");
      f.title = `Map: ${slot.dataset.title}`; f.loading = "lazy"; f.referrerPolicy = "no-referrer";
      f.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
      e.currentTarget.replaceWith(f);
    }, { once: true });
  }
}
