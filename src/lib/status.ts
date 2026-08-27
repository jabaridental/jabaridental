import type { DayHours, SpecialHours } from "./types";

export interface KampalaParts {
  hh: number;
  mm: number;
  weekday: number; // 0 Sunday .. 6 Saturday
  ymd: string; // YYYY-MM-DD
}

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

// Returns Kampala local date/time parts from a JS Date (which is UTC-based).
export function getKampalaParts(d: Date = new Date()): KampalaParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Kampala",
    hour12: false,
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  let hh = parseInt(get("hour"), 10);
  if (hh === 24) hh = 0;
  const mm = parseInt(get("minute"), 10);
  const weekday = DAY_KEYS.indexOf(get("weekday").toLowerCase() as any);
  const ymd = `${get("year")}-${get("month")}-${get("day")}`;
  return { hh, mm, weekday, ymd };
}

function toMinutes(hh: number, mm: number): number {
  return hh * 60 + mm;
}

export interface ClinicStatus {
  state: "open" | "closed";
  open: boolean;
  label: string; // "Open now" / "Closed"
  detail: string; // "Closes at 18:00" / "Opens at 08:00" / "Opens Monday at 08:00"
  note?: string;
}

function intervalOpen(
  parts: KampalaParts,
  open: string,
  close: string
): boolean {
  if (!open || !close) return false;
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  const now = toMinutes(parts.hh, parts.mm);
  return now >= toMinutes(oh, om) && now < toMinutes(ch, cm);
}

export function computeStatus(
  hours: DayHours[],
  special: SpecialHours[] = [],
  d: Date = new Date()
): ClinicStatus {
  const parts = getKampalaParts(d);
  const todaySpecial = special.find((s) => s.date === parts.ymd);

  // Build today's effective schedule
  let dayKey = DAY_KEYS[parts.weekday];
  let day = hours.find((h) => h.day === dayKey);
  if (!day) day = { day: dayKey, label: "", closed: true, open: "", close: "", open2: "", close2: "" };

  let schedule: { open: string; close: string }[] = [];
  let note: string | undefined;

  if (todaySpecial) {
    if (todaySpecial.closed) {
      return buildClosed(hours, parts, todaySpecial.note || "Closed for a special day");
    }
    schedule = [{ open: todaySpecial.open, close: todaySpecial.close }];
    note = todaySpecial.note;
  } else if (!day.closed) {
    schedule = [{ open: day.open, close: day.close }];
    if (day.open2 && day.close2) schedule.push({ open: day.open2, close: day.close2 });
  }

  if (schedule.length === 0) {
    return buildClosed(hours, parts, note);
  }

  // Check if currently within any interval
  for (const s of schedule) {
    if (intervalOpen(parts, s.open, s.close)) {
      return { state: "open", open: true, label: "Open now", detail: `Closes at ${s.close}`, note };
    }
  }

  // Before today's first opening?
  const firstOpen = schedule
    .map((s) => toMinutes(...(s.open.split(":").map(Number) as [number, number])))
    .sort((a, b) => a - b)[0];
  const nowMin = toMinutes(parts.hh, parts.mm);
  if (nowMin < firstOpen) {
    return {
      state: "closed",
      open: false,
      label: "Closed",
      detail: `Opens at ${schedule[0].open}`,
      note,
    };
  }

  // After all closings -> next opening day
  return buildClosed(hours, parts, note);
}

function buildClosed(hours: DayHours[], parts: KampalaParts, note?: string): ClinicStatus {
  // Find next day (starting tomorrow) that is open
  for (let i = 1; i <= 7; i++) {
    const idx = (parts.weekday + i) % 7;
    const key = DAY_KEYS[idx];
    const day = hours.find((h) => h.day === key);
    if (day && !day.closed && day.open) {
      const label = idx === (parts.weekday + 1) % 7 ? "tomorrow" : day.label || key;
      return {
        state: "closed",
        open: false,
        label: "Closed",
        detail: `Opens ${label} at ${day.open}`,
        note,
      };
    }
  }
  return { state: "closed", open: false, label: "Closed", detail: "Currently closed", note };
}

export function formatKampalaTime(d: Date = new Date()): string {
  const p = getKampalaParts(d);
  const ampm = p.hh >= 12 ? "PM" : "AM";
  let h = p.hh % 12;
  if (h === 0) h = 12;
  const mm = p.mm.toString().padStart(2, "0");
  return `${h}:${mm} ${ampm} EAT`;
}
