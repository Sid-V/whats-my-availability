import type { BusyPeriod, DayAvailability, TimeSlot } from "./types";

const FREEBUSY_URL = "https://www.googleapis.com/calendar/v3/freeBusy";

export async function fetchBusyPeriods(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<BusyPeriod[]> {
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
      items: [{ id: "primary" }],
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Session expired. Please sign in again.");
    }
    throw new Error(`Calendar API error: ${response.status}`);
  }

  const data = await response.json();
  return data.calendars.primary.busy;
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
