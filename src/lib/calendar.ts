import type { BusyPeriod, DayAvailability, TimeSlot } from "./types";

const FREEBUSY_URL = "https://www.googleapis.com/calendar/v3/freeBusy";
const CALENDAR_LIST_URL =
  "https://www.googleapis.com/calendar/v3/users/me/calendarList";

// Holiday and birthday calendars use well-known prefixes
const EXCLUDED_PREFIXES = [
  "#contacts@group.v.calendar.google.com",  // birthdays
  "#holiday@group.v.calendar.google.com",   // holidays
  "en.holidays",                             // regional holidays (e.g. en.usa#holiday)
];

function isExcludedCalendar(id: string): boolean {
  return EXCLUDED_PREFIXES.some(
    (prefix) => id.includes(prefix) || id.startsWith(prefix)
  );
}

async function fetchCalendarIds(accessToken: string): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(CALENDAR_LIST_URL);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Session expired. Please sign in again.");
      }
      throw new Error(`Calendar list API error: ${response.status}`);
    }

    const data = await response.json();
    for (const cal of data.items ?? []) {
      if (!isExcludedCalendar(cal.id)) {
        ids.push(cal.id);
      }
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return ids;
}

export async function fetchBusyPeriods(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<BusyPeriod[]> {
  const calendarIds = await fetchCalendarIds(accessToken);

  const response = await fetch(FREEBUSY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      items: calendarIds.map((id) => ({ id })),
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Session expired. Please sign in again.");
    }
    throw new Error(`Calendar API error: ${response.status}`);
  }

  const data = await response.json();
  const allBusy: BusyPeriod[] = [];
  for (const calId of Object.keys(data.calendars ?? {})) {
    const periods: BusyPeriod[] = data.calendars[calId].busy ?? [];
    allBusy.push(...periods);
  }
  return allBusy;
}

export function computeAvailableSlots(
  busyPeriods: BusyPeriod[],
  businessDays: Date[],
  startHour: number,
  endHour: number,
  minSlotMinutes: number
): DayAvailability[] {
  const result: DayAvailability[] = [];

  for (const day of businessDays) {
    const dayStart = new Date(day);
    dayStart.setHours(startHour, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(endHour, 0, 0, 0);

    const dayBusy = busyPeriods
      .map((b) => ({
        start: new Date(
          Math.max(new Date(b.start).getTime(), dayStart.getTime())
        ),
        end: new Date(Math.min(new Date(b.end).getTime(), dayEnd.getTime())),
      }))
      .filter((b) => b.start < b.end)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const slots: TimeSlot[] = [];
    let cursor = dayStart;

    for (const busy of dayBusy) {
      if (cursor < busy.start) {
        const gapMinutes =
          (busy.start.getTime() - cursor.getTime()) / 60000;
        if (gapMinutes >= minSlotMinutes) {
          slots.push({ start: new Date(cursor), end: new Date(busy.start) });
        }
      }
      if (busy.end > cursor) {
        cursor = busy.end;
      }
    }

    if (cursor < dayEnd) {
      const gapMinutes = (dayEnd.getTime() - cursor.getTime()) / 60000;
      if (gapMinutes >= minSlotMinutes) {
        slots.push({ start: new Date(cursor), end: dayEnd });
      }
    }

    result.push({ date: day, slots });
  }

  return result;
}

export async function getAvailability(
  accessToken: string,
  businessDays: Date[]
): Promise<DayAvailability[]> {
  const firstDay = new Date(businessDays[0]);
  firstDay.setHours(0, 0, 0, 0);
  const lastDay = new Date(businessDays[businessDays.length - 1]);
  lastDay.setHours(23, 59, 59, 999);

  const busyPeriods = await fetchBusyPeriods(
    accessToken,
    firstDay.toISOString(),
    lastDay.toISOString()
  );

  return computeAvailableSlots(busyPeriods, businessDays, 9, 17, 60);
}
