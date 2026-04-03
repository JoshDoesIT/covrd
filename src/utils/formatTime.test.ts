import { describe, it, expect } from 'vitest'
import { formatTime } from './formatTime'

describe('formatTime', () => {
  describe('24h format', () => {
    it('returns the input as-is', () => {
      expect(formatTime('14:30', '24h')).toBe('14:30')
      expect(formatTime('09:00', '24h')).toBe('09:00')
      expect(formatTime('00:00', '24h')).toBe('00:00')
    })
  })

  describe('12h format', () => {
    it('converts afternoon times', () => {
      expect(formatTime('14:30', '12h')).toBe('2:30 PM')
      expect(formatTime('13:00', '12h')).toBe('1:00 PM')
      expect(formatTime('23:59', '12h')).toBe('11:59 PM')
    })

    it('converts morning times', () => {
      expect(formatTime('09:00', '12h')).toBe('9:00 AM')
      expect(formatTime('06:30', '12h')).toBe('6:30 AM')
      expect(formatTime('11:59', '12h')).toBe('11:59 AM')
    })

    it('handles noon correctly', () => {
      expect(formatTime('12:00', '12h')).toBe('12:00 PM')
    })

    it('handles midnight correctly', () => {
      expect(formatTime('00:00', '12h')).toBe('12:00 AM')
    })

    it('handles edge case with invalid input', () => {
      expect(formatTime('abc', '12h')).toBe('abc')
    })
  })
})
