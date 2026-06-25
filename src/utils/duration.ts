/**
 * Converts a duration expressed in minutes into a readable "Xh Ym" label.
 *
 * @example
 * formatMinutesAsHours(111); // "1 h 51 min"
 * formatMinutesAsHours(120); // "2 h"
 * formatMinutesAsHours(45);  // "45 min"
 */
export function formatMinutesAsHours(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return '0 min';
  }

  const minutes = Math.round(totalMinutes);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
}
