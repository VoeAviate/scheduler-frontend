export interface AvailabilitySlot {
  day: string;       // ISO Date format: YYYY-MM-DD
  startTime: string; // Time string format: HH:mm
  endTime: string;   // Time string format: HH:mm
}

export interface DefaultAvailability {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // Time string format: HH:mm
  endTime: string;   // Time string format: HH:mm
}

export interface AvailabilitySummary {
  day: string;
  slots: { startTime: string; endTime: string }[];
}
