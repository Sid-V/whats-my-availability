export function getNextBusinessDays(count: number, fromDate: Date = new Date()): Date[] {
  const days: Date[] = [];
  const current = new Date(fromDate);
  current.setDate(current.getDate() + 1);
  current.setHours(0, 0, 0, 0);

  while (days.length < count) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) {
      days.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return days;
}
