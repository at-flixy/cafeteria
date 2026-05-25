export function startOfLocalDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function slotStartAt(slotDate: Date, startTime: string) {
  const [hours, minutes] = startTime.split(":").map(Number);
  const value = new Date(slotDate);
  value.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return value;
}
