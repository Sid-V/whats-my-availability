import type { DayAvailability } from "./types";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatAvailabilityText(
  days: DayAvailability[],
  timezone: string
): string {
  const lines: string[] = [];
  const weekOf = days.length > 0
    ? days[0].date.toLocaleDateString("en-US", { month: "long", day: "numeric" })
    : "";
  const header = `My availability week of ${weekOf} (${timezone}):`;
  lines.push(header);
  lines.push("");

  for (const day of days) {
    const m = day.date.getMonth() + 1;
    const d = day.date.getDate();
    const long = day.date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    lines.push(`(${m}/${d}) - ${long}`);

    if (day.slots.length === 0) {
      lines.push("  No availability");
    } else {
      for (const slot of day.slots) {
        lines.push(`  ${formatTime(slot.start)} - ${formatTime(slot.end)}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
