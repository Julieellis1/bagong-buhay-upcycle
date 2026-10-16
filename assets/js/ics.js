/** Build and download an .ics file for one event (times as given, with offset → UTC). */
const z = (d) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const clean = (s) => String(s || "").replace(/[\\,;]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
export function icsFor(e) {
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bagong Buhay//Markets//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${e.id}@bagongbuhay`, `DTSTAMP:${z(Date.now())}`, `DTSTART:${z(e.start)}`, `DTEND:${z(e.end || e.start)}`,
    `SUMMARY:${clean("Bagong Buhay at " + e.name)}`, `LOCATION:${clean([e.venue, e.address].filter(Boolean).join(", "))}`,
    `DESCRIPTION:${clean(e.note || "")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
export function download(e) {
  const blob = new Blob([icsFor(e)], { type: "text/calendar" }); const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = `bagong-buhay-${e.id}.ics`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
