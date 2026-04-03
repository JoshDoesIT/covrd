export type TimeBlock = {
  start: string // HH:mm
  end: string // HH:mm
}

/**
 * Converts a HH:mm string to minutes since midnight.
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return (hours * 60) + minutes
}

/**
 * Converts minutes since midnight to a HH:mm string.
 */
export function minutesToTime(minutes: number): string {
  const normalized = minutes % 1440
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/**
 * Calculates duration in hours between two HH:mm strings.
 * Handles overnight shifts by wrapping around 24 hours.
 */
export function calculateDuration(start: string, end: string): number {
  const startMins = timeToMinutes(start)
  const endMins = timeToMinutes(end)
  
  if (endMins < startMins) {
    // Overnight shift
    return ((1440 - startMins) + endMins) / 60
  }
  
  return (endMins - startMins) / 60
}

/**
 * Checks if two time blocks overlap.
 * Adjacent blocks (e.g., 09:00-11:00 and 11:00-13:00) do NOT overlap.
 */
export function isOverlapping(blockA: TimeBlock, blockB: TimeBlock): boolean {
  const aStart = timeToMinutes(blockA.start)
  let aEnd = timeToMinutes(blockA.end)
  const bStart = timeToMinutes(blockB.start)
  let bEnd = timeToMinutes(blockB.end)

  // Handle overnight wrapping for simple comparison
  if (aEnd < aStart) aEnd += 1440
  if (bEnd < bStart) bEnd += 1440

  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd)
}
