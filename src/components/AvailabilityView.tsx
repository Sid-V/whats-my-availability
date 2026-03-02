import type { DayAvailability, SharedAvailabilityData } from "../lib/types";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const long = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  return `(${m}/${d}) - ${long}`;
}

interface AvailabilityViewProps {
  days?: DayAvailability[];
  shared?: SharedAvailabilityData;
}

export function AvailabilityView({ days, shared }: AvailabilityViewProps) {
  if (shared) {
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzDiffers = shared.tz !== localTz;

    // "week of March 2nd" from the first day
    const firstDate = shared.days.length > 0
      ? new Date(shared.days[0].date + "T00:00:00")
      : new Date();
    const weekOf = firstDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });

    const displayName = shared.name || "Someone";

    return (
      <div className="availability">
        <h2>{displayName}'s availability week of {weekOf}</h2>
        <p className="subtitle">
          Times shown in {tzDiffers ? `your timezone (${localTz})` : shared.tz}
          {tzDiffers && <span> — originally {shared.tz}</span>}
        </p>
        {shared.days.map((day) => (
          <div key={day.date} className="day">
            <h3>{formatDate(new Date(day.date + "T00:00:00"))}</h3>
            {day.slots.length === 0 ? (
              <p className="no-slots">No availability</p>
            ) : (
              <ul>
                {day.slots.map(([start, end], i) => (
                  <li key={i}>
                    {formatTime(new Date(start))} – {formatTime(new Date(end))}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        <p className="generated">
          Generated{" "}
          {new Date(shared.generated).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    );
  }

  if (!days) return null;

  return (
    <div className="availability">
      <h2>Your Availability</h2>
      <p className="subtitle">
        Next 5 business days, 9 AM – 5 PM (
        {Intl.DateTimeFormat().resolvedOptions().timeZone})
      </p>
      {days.map((day) => (
        <div key={day.date.toISOString()} className="day">
          <h3>{formatDate(day.date)}</h3>
          {day.slots.length === 0 ? (
            <p className="no-slots">No availability</p>
          ) : (
            <ul>
              {day.slots.map((slot, i) => (
                <li key={i}>
                  {formatTime(slot.start)} – {formatTime(slot.end)}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
