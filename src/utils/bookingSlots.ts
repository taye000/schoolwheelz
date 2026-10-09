const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function dateKey(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((value) => value.type === type)?.value ?? "00";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function kenyaTime(value: Date | string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  return `${parts.find((part) => part.type === "hour")?.value ?? "00"}:${parts.find((part) => part.type === "minute")?.value ?? "00"}`;
}

function slotTimes(booking: any): string[] {
  const times: string[] = [];
  if (booking.bookingType === "recurring" && booking.recurringMeta) {
    if (["morning", "both"].includes(booking.direction) && booking.recurringMeta.morningTime) {
      times.push(booking.recurringMeta.morningTime);
    }
    if (["evening", "both"].includes(booking.direction)) {
      const evening = booking.recurringMeta.eveningTime ?? booking.returnTime;
      if (evening) times.push(evening);
    }
    return times;
  }

  if (["morning", "both"].includes(booking.direction)) {
    const tripDate = new Date(booking.tripDate);
    if (!Number.isNaN(tripDate.getTime())) times.push(kenyaTime(tripDate));
  }
  if (["evening", "both"].includes(booking.direction) && booking.returnTime) {
    times.push(booking.returnTime);
  } else if (booking.direction === "evening") {
    const tripDate = new Date(booking.tripDate);
    if (!Number.isNaN(tripDate.getTime())) times.push(kenyaTime(tripDate));
  }
  return times;
}

function dateRange(booking: any): [string, string] {
  if (booking.bookingType === "recurring" && booking.recurringMeta) {
    const start = dateKey(booking.recurringMeta.startDate ?? booking.tripDate);
    return [start, dateKey(booking.recurringMeta.endDate ?? booking.recurringMeta.startDate ?? booking.tripDate)];
  }
  const tripDay = dateKey(booking.tripDate);
  return [tripDay, tripDay];
}

function runsOn(booking: any, day: string) {
  if (booking.bookingType !== "recurring" || !booking.recurringMeta) {
    return dateKey(booking.tripDate) === day;
  }
  const days: string[] = booking.recurringMeta.days ?? [];
  return days.includes(WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()]);
}

export function bookingsShareTripSlot(first: any, second: any) {
  const sharedTime = slotTimes(first).some((time) => slotTimes(second).includes(time));
  if (!sharedTime) return false;

  const [firstStart, firstEnd] = dateRange(first);
  const [secondStart, secondEnd] = dateRange(second);
  if (!firstStart || !firstEnd || !secondStart || !secondEnd) return false;
  const overlapStart = firstStart > secondStart ? firstStart : secondStart;
  const overlapEnd = firstEnd < secondEnd ? firstEnd : secondEnd;
  if (overlapStart > overlapEnd) return false;

  const day = new Date(`${overlapStart}T00:00:00Z`);
  const lastDay = new Date(`${overlapEnd}T00:00:00Z`);
  for (; day <= lastDay; day.setUTCDate(day.getUTCDate() + 1)) {
    const key = day.toISOString().slice(0, 10);
    if (runsOn(first, key) && runsOn(second, key)) return true;
  }
  return false;
}