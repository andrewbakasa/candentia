// utils/dateUtils.ts (Create this file)

/** Returns the start of the current day in UTC. */
export function getStartOfTodayUTC(): Date {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now;
}

/** Returns the start of the current week (Sunday) in UTC. */
export function getStartOfWeekUTC(): Date {
  const now = getStartOfTodayUTC();
  const day = now.getUTCDay(); // 0 for Sunday, 1 for Monday
  now.setUTCDate(now.getUTCDate() - day);
  return now;
}

/** Returns the start of the current month in UTC. */
export function getStartOfMonthUTC(): Date {
  const now = getStartOfTodayUTC();
  now.setUTCDate(1);
  return now;
}

/** Returns the start of the last month in UTC. */
export function getStartOfLastMonthUTC(): { start: Date, end: Date } {
  const now = new Date();
  // Start of this month
  const end = getStartOfMonthUTC(); 

  // Start of last month
  const start = new Date(now.getUTCFullYear(), now.getUTCMonth() - 1, 1);
  start.setUTCHours(0, 0, 0, 0);

  return { start, end };
}