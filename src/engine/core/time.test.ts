import { timeToMinutes, minutesToTime, isOverlapping, calculateDuration } from './time'

describe('Time Utils', () => {
  describe('timeToMinutes', () => {
    it('converts HH:mm to minutes since midnight', () => {
      expect(timeToMinutes('00:00')).toBe(0)
      expect(timeToMinutes('09:30')).toBe(570)
      expect(timeToMinutes('13:45')).toBe(825)
      expect(timeToMinutes('23:59')).toBe(1439)
    })
  })

  describe('minutesToTime', () => {
    it('converts minutes to HH:mm format', () => {
      expect(minutesToTime(0)).toBe('00:00')
      expect(minutesToTime(570)).toBe('09:30')
      expect(minutesToTime(825)).toBe('13:45')
      expect(minutesToTime(1439)).toBe('23:59')
    })

    it('handles carry over past midnight', () => {
      expect(minutesToTime(1440)).toBe('00:00')
      expect(minutesToTime(1500)).toBe('01:00')
    })
  })

  describe('isOverlapping', () => {
    it('returns true if time blocks overlap', () => {
      // Overlap fully inside
      expect(
        isOverlapping({ start: '09:00', end: '13:00' }, { start: '10:00', end: '12:00' }),
      ).toBe(true)
      // Overlap partial start
      expect(
        isOverlapping({ start: '09:00', end: '13:00' }, { start: '08:00', end: '10:00' }),
      ).toBe(true)
      // Overlap partial end
      expect(
        isOverlapping({ start: '09:00', end: '13:00' }, { start: '12:00', end: '14:00' }),
      ).toBe(true)
      // Exact match
      expect(
        isOverlapping({ start: '09:00', end: '13:00' }, { start: '09:00', end: '13:00' }),
      ).toBe(true)
    })

    it('returns false if time blocks do not overlap', () => {
      // Adjacent
      expect(
        isOverlapping({ start: '09:00', end: '11:00' }, { start: '11:00', end: '13:00' }),
      ).toBe(false)
      // Completely disjoint
      expect(
        isOverlapping({ start: '09:00', end: '11:00' }, { start: '15:00', end: '17:00' }),
      ).toBe(false)
    })
  })

  describe('calculateDuration', () => {
    it('calculates duration in hours', () => {
      expect(calculateDuration('09:00', '13:00')).toBe(4)
      expect(calculateDuration('09:30', '13:45')).toBe(4.25)
    })

    it('handles overnight shifts (end < start)', () => {
      expect(calculateDuration('22:00', '02:00')).toBe(4)
      expect(calculateDuration('23:30', '01:00')).toBe(1.5)
    })
  })
})
