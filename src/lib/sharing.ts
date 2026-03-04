import LZString from "lz-string";
import type { DayAvailability, SharedAvailabilityData } from "./types";

export function encodeAvailability(days: DayAvailability[], name: string): string {
  const data: SharedAvailabilityData = {
    name,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    generated: new Date().toISOString(),
    days: days.map((d) => ({
      date: d.date.toISOString().split("T")[0],
      slots: d.slots.map((s) => [s.start.toISOString(), s.end.toISOString()]),
    })),
  };

  const json = JSON.stringify(data);
  const compressed = LZString.compressToEncodedURIComponent(json);
  return `${window.location.origin}${window.location.pathname}?d=${compressed}`;
}

const MAX_NAME_LENGTH = 50;
const MAX_DAYS = 10;
const MAX_SLOTS_PER_DAY = 20;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidISODate(s: unknown): boolean {
  return typeof s === "string" && !isNaN(new Date(s).getTime());
}

function validateSharedData(data: unknown): SharedAvailabilityData | null {
  if (typeof data !== "object" || data === null || Array.isArray(data))
    return null;

  const d = data as Record<string, unknown>;

  // name: string, bounded length, strip control characters
  if (typeof d.name !== "string") return null;
  // eslint-disable-next-line no-control-regex
  const name = d.name.replace(/[\x00-\x1f\x7f]/g, "").slice(0, MAX_NAME_LENGTH);

  // tz: non-empty string
  if (typeof d.tz !== "string" || d.tz.length === 0 || d.tz.length > 100)
    return null;

  // generated: valid ISO datetime
  if (!isValidISODate(d.generated)) return null;

  // days: array, bounded length
  if (!Array.isArray(d.days) || d.days.length === 0 || d.days.length > MAX_DAYS)
    return null;

  const days: SharedAvailabilityData["days"] = [];
  for (const day of d.days) {
    if (typeof day !== "object" || day === null || Array.isArray(day))
      return null;

    const dayObj = day as Record<string, unknown>;

    // date: YYYY-MM-DD format that parses to a valid date
    if (typeof dayObj.date !== "string" || !DATE_RE.test(dayObj.date))
      return null;
    if (isNaN(new Date(dayObj.date + "T00:00:00").getTime())) return null;

    // slots: array of [start, end] ISO string tuples
    if (!Array.isArray(dayObj.slots) || dayObj.slots.length > MAX_SLOTS_PER_DAY)
      return null;

    const slots: [string, string][] = [];
    for (const slot of dayObj.slots) {
      if (!Array.isArray(slot) || slot.length !== 2) return null;
      if (!isValidISODate(slot[0]) || !isValidISODate(slot[1])) return null;
      slots.push([slot[0] as string, slot[1] as string]);
    }

    days.push({ date: dayObj.date, slots });
  }

  return { name, tz: d.tz as string, generated: d.generated as string, days };
}

export function decodeAvailability(
  param: string
): SharedAvailabilityData | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(param);
    if (!json) return null;
    const parsed: unknown = JSON.parse(json);
    return validateSharedData(parsed);
  } catch {
    return null;
  }
}
