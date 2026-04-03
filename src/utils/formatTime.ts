/**
 * Format a 24h "HH:mm" time string into the requested format.
 *
 * @param time24 - Time string in "HH:mm" format (e.g., "14:30")
 * @param format - Target format: '12h' or '24h'
 * @returns Formatted time string (e.g., "2:30 PM" or "14:30")
 */
export function formatTime(time24: string, format: '12h' | '24h'): string {
  if (format === '24h') return time24

  const [hourStr, minuteStr] = time24.split(':')
  const hour = parseInt(hourStr, 10)
  const minute = minuteStr ?? '00'

  if (isNaN(hour)) return time24

  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour

  return `${displayHour}:${minute} ${period}`
}
