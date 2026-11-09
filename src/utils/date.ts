/**
 * Date and Time utilities for whence
 * Standardized to Eastern Time (America/New_York) for daily game synchronization.
 */

import { HistoricalFigure } from '../types/game';
import { getDailyPack, DEFAULT_FIGURES } from '../data/figures';

export const EASTERN_TIMEZONE = 'America/New_York';

/**
 * Returns the date key in YYYY-MM-DD format for Eastern Time (America/New_York).
 */
export function getEasternDateKey(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: EASTERN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value || '2026';
  const month = parts.find((p) => p.type === 'month')?.value || '01';
  const day = parts.find((p) => p.type === 'day')?.value || '01';
  return `${year}-${month}-${day}`;
}

/**
 * Formats the current date in Eastern Time into a natural, friendly string
 * e.g. "Sunday, November 8, 2026"
 */
export function formatEasternDateDisplay(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: EASTERN_TIMEZONE,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return formatter.format(date);
}

/**
 * Formats a YYYY-MM-DD date key into a short readable string (e.g., "Sun, Nov 8")
 */
export function formatFriendlyDate(dateKey: string): string {
  try {
    const [y, m, d] = dateKey.split('-').map(Number);
    // Construct local midnight representation for display
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateKey;
  }
}

/**
 * Format any Date object to YYYY-MM-DD (calendar stepper helper)
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates previous day's YYYY-MM-DD in UTC to avoid any daylight savings/timezone drift.
 */
export function getPreviousDayKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - 1);
  const prevY = date.getUTCFullYear();
  const prevM = String(date.getUTCMonth() + 1).padStart(2, '0');
  const prevD = String(date.getUTCDate()).padStart(2, '0');
  return `${prevY}-${prevM}-${prevD}`;
}

/**
 * Calculates next day's YYYY-MM-DD in UTC.
 */
export function getNextDayKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + 1);
  const nextY = date.getUTCFullYear();
  const nextM = String(date.getUTCMonth() + 1).padStart(2, '0');
  const nextD = String(date.getUTCDate()).padStart(2, '0');
  return `${nextY}-${nextM}-${nextD}`;
}

/**
 * Resolves the 10-figure roster for a given date.
 * If a game has not been programmed for the date, it defaults to the previous day.
 */
export function resolveGameRosterForDate(
  dateKey: string,
  calendarSchedules: Record<string, HistoricalFigure[]>
): HistoricalFigure[] {
  // 1. If date has an explicitly programmed roster with figures, use it
  if (calendarSchedules[dateKey] && calendarSchedules[dateKey].length > 0) {
    return calendarSchedules[dateKey];
  }

  // 2. If not programmed for this date, default to the previous day!
  const prevDateKey = getPreviousDayKey(dateKey);
  if (calendarSchedules[prevDateKey] && calendarSchedules[prevDateKey].length > 0) {
    return calendarSchedules[prevDateKey];
  }

  // 3. If previous day was also unprogrammed, look back to find the most recent programmed day before dateKey
  const priorScheduledDates = Object.keys(calendarSchedules)
    .filter((k) => k < dateKey && Array.isArray(calendarSchedules[k]) && calendarSchedules[k].length > 0)
    .sort();

  if (priorScheduledDates.length > 0) {
    const mostRecentDate = priorScheduledDates[priorScheduledDates.length - 1];
    return calendarSchedules[mostRecentDate];
  }

  // 4. Fallback to previous day's daily pack or today's pack
  const prevPack = getDailyPack(prevDateKey);
  if (prevPack && prevPack.length > 0) {
    return prevPack;
  }

  const todayPack = getDailyPack(dateKey);
  if (todayPack && todayPack.length > 0) {
    return todayPack;
  }

  return DEFAULT_FIGURES;
}

/**
 * Calculates remaining seconds until the next midnight in Eastern Time (America/New_York).
 */
export function getSecondsUntilMidnightEastern(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: EASTERN_TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const hourVal = parts.find((p) => p.type === 'hour')?.value || '0';
  const minVal = parts.find((p) => p.type === 'minute')?.value || '0';
  const secVal = parts.find((p) => p.type === 'second')?.value || '0';

  const hours = Number(hourVal) % 24;
  const minutes = Number(minVal);
  const seconds = Number(secVal);

  const secondsPassedToday = hours * 3600 + minutes * 60 + seconds;
  return Math.max(0, 86400 - secondsPassedToday);
}
