import type { DayOfWeek } from '../types/index'

const DAY_OFFSETS: Record<DayOfWeek, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
}

/**
 * Returns the Date object representing the upcoming Monday at 00:00:00 local time.
 * If today is Monday, it returns today.
 */
export function getNextMonday(from: Date = new Date()): Date {
  const date = new Date(from.getTime())
  date.setHours(0, 0, 0, 0)

  const day = date.getDay()
  // getDay() returns 0 for Sunday, 1 for Monday.
  // If it's Monday (1), we stay today.
  // If it's Tuesday (2), we add 6 days.
  // If it's Sunday (0), we add 1 day.
  const diffToMonday = day === 0 ? 1 : day === 1 ? 0 : 8 - day

  date.setDate(date.getDate() + diffToMonday)
  return date
}

/**
 * Returns a Date object offset from a given start date by a number of weeks and a specific day of the week.
 * Assumes startDate is a Monday.
 */
export function getShiftDate(startDateIso: string, weekOffset: number, day: DayOfWeek): Date {
  // Ensure we append T00:00:00 if not present to force local timezone parsing instead of UTC
  const safeIso = startDateIso.includes('T') ? startDateIso : `${startDateIso}T00:00:00`
  const date = new Date(safeIso)
  date.setHours(0, 0, 0, 0)

  // Resiliency: Always align our base calculation to the Monday of the week `date` is in
  const currentDay = date.getDay()
  const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1
  date.setDate(date.getDate() - daysToSubtract)

  const daysToAdd = weekOffset * 7 + DAY_OFFSETS[day]
  date.setDate(date.getDate() + daysToAdd)
  return date
}

/**
 * Formats a specific scheduled day as a short string, e.g., "Mon 4/6".
 */
export function formatDayHeader(startDateIso: string, weekOffset: number, day: DayOfWeek): string {
  const date = getShiftDate(startDateIso, weekOffset, day)
  const dayNamePrefix = day.charAt(0).toUpperCase() + day.slice(1, 3)
  return `${dayNamePrefix} ${date.getMonth() + 1}/${date.getDate()}`
}

/**
 * Formats a full week range from a Monday start date plus week offset.
 * Example: "Apr 6 - Apr 12"
 */
export function formatWeekRange(startDateIso: string, weekOffset: number): string {
  const start = getShiftDate(startDateIso, weekOffset, 'monday')
  const end = getShiftDate(startDateIso, weekOffset, 'sunday')

  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  return `${formatter.format(start)} - ${formatter.format(end)}`
}
