export interface BusyPeriod {
  start: string; // ISO 8601
  end: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface DayAvailability {
  date: Date;
  slots: TimeSlot[];
}

export interface SharedAvailabilityData {
  name: string;
  tz: string;
  generated: string;
  days: {
    date: string;
    slots: [string, string][];
  }[];
}
