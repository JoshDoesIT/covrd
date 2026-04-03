import { expect, test, describe } from 'vitest'
import { getNextMonday, getShiftDate, formatDayHeader, formatWeekRange } from './scheduleDates'

describe('scheduleDates utilities', () => {
  test('getNextMonday returns the upcoming Monday or exactly today if today is Monday', () => {
    // Note: JS Date months are 0-indexed.
    const wednesday = new Date(2026, 3, 1) // April 1, 2026 was a Wed
    const nextMonday = getNextMonday(wednesday)
    expect(nextMonday.getDate()).toBe(6) // Apr 6
    expect(nextMonday.getDay()).toBe(1) // Monday

    const sunday = new Date(2026, 3, 5) // Apr 5, 2026
    const nextMondaySunday = getNextMonday(sunday)
    expect(nextMondaySunday.getDate()).toBe(6) // Apr 6

    const monday = new Date(2026, 3, 6) // Apr 6, 2026
    const nextMondayMonday = getNextMonday(monday)
    expect(nextMondayMonday.getDate()).toBe(6) // Still Apr 6
  })

  test('getShiftDate handles offsets correctly', () => {
    const startIso = new Date(2026, 3, 6, 0, 0, 0).toISOString() // Apr 6, 2026
    
    // Test same day
    const monW0 = getShiftDate(startIso, 0, 'monday')
    expect(monW0.getDate()).toBe(6)

    // Test end of week
    const sunW0 = getShiftDate(startIso, 0, 'sunday')
    expect(sunW0.getDate()).toBe(12)

    // Test next week
    const monW1 = getShiftDate(startIso, 1, 'monday')
    expect(monW1.getDate()).toBe(13)
  })

  test('formatDayHeader formatting', () => {
    const startIso = new Date(2026, 3, 6, 0, 0, 0).toISOString() // Apr 6, 2026
    expect(formatDayHeader(startIso, 0, 'monday')).toBe('Mon 4/6')
    expect(formatDayHeader(startIso, 0, 'wednesday')).toBe('Wed 4/8')
    expect(formatDayHeader(startIso, 1, 'tuesday')).toBe('Tue 4/14')
  })

  test('formatWeekRange formatting', () => {
    const startIso = new Date(2026, 3, 6, 0, 0, 0).toISOString() // Apr 6, 2026
    expect(formatWeekRange(startIso, 0)).toBe('Apr 6 - Apr 12')
    expect(formatWeekRange(startIso, 1)).toBe('Apr 13 - Apr 19')
  })
})
