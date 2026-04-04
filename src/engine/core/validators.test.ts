import type { EngineEmployee as Employee, EngineShift as Shift } from '../types'
import {
  isAvailableForShift,
  wouldExceedMaxHours,
  hasShiftOnSameDay,
  isEligibleForShift,
} from './validators'

describe('Constraint Validators', () => {
  const mockEmployee: Employee = {
    id: 'emp-1',
    name: 'Alice',
    role: 'RN',
    maxHours: 40,
    minHours: 0,
    targetHours: 36,
    isFullTime: true,
    availability: [
      { dayOfWeek: 1, isAvailable: true, preferences: [] }, // Monday available
      { dayOfWeek: 2, isAvailable: false, preferences: [] }, // Tuesday unavailable
      { dayOfWeek: 3, isAvailable: true, preferences: [{ start: '09:00', end: '17:00' }] }, // Wed preferred block
    ],
    createdAt: 0,
    updatedAt: 0,
  }

  const mockShift: Shift = {
    id: 'shift-1',
    weekNumber: 0,
    dayOfWeek: 1, // Monday
    start: '09:00',
    end: '17:00',
    role: 'RN',
    durationHours: 8,
    isAssigned: false,
  }

  describe('isAvailableForShift', () => {
    it('returns true if employee is available for the day', () => {
      expect(isAvailableForShift(mockEmployee, mockShift)).toBe(true)
    })

    it('returns false if employee is marked unavailable for the day', () => {
      const tuesdayShift: Shift = { ...mockShift, dayOfWeek: 2 }
      expect(isAvailableForShift(mockEmployee, tuesdayShift)).toBe(false)
    })

    it('returns true if day is missing from availability (assume available by default)', () => {
      const thursdayShift: Shift = { ...mockShift, dayOfWeek: 4 }
      expect(isAvailableForShift(mockEmployee, thursdayShift)).toBe(true)
    })

    describe('time block constraints', () => {
      it('returns true if shift falls completely within a preferred time block', () => {
        const wedShift: Shift = { ...mockShift, dayOfWeek: 3, start: '10:00', end: '16:00' }
        expect(isAvailableForShift(mockEmployee, wedShift)).toBe(true)
      })

      it('returns false if shift starts before the preferred time block', () => {
        const wedShiftEarly: Shift = { ...mockShift, dayOfWeek: 3, start: '08:00', end: '16:00' }
        expect(isAvailableForShift(mockEmployee, wedShiftEarly)).toBe(false)
      })

      it('returns false if shift ends after the preferred time block', () => {
        const wedShiftLate: Shift = { ...mockShift, dayOfWeek: 3, start: '10:00', end: '18:00' }
        expect(isAvailableForShift(mockEmployee, wedShiftLate)).toBe(false)
      })

      it('returns false if shift is completely outside the preferred time block', () => {
        const wedShiftOutside: Shift = { ...mockShift, dayOfWeek: 3, start: '18:00', end: '22:00' }
        expect(isAvailableForShift(mockEmployee, wedShiftOutside)).toBe(false)
      })

      it('returns true if shift wraps overnight and fits into an overnight availability block', () => {
        const nightEmp: Employee = {
          ...mockEmployee,
          availability: [
            { dayOfWeek: 5, isAvailable: true, preferences: [{ start: '22:00', end: '06:00' }] },
          ],
        }
        const nightShift: Shift = { ...mockShift, dayOfWeek: 5, start: '23:00', end: '05:00' }
        expect(isAvailableForShift(nightEmp, nightShift)).toBe(true)
      })

      it('returns false if overnight shift falls outside an overnight availability block', () => {
        const nightEmp: Employee = {
          ...mockEmployee,
          availability: [
            { dayOfWeek: 5, isAvailable: true, preferences: [{ start: '22:00', end: '06:00' }] },
          ],
        }
        const nightShiftBad: Shift = { ...mockShift, dayOfWeek: 5, start: '21:00', end: '05:00' }
        expect(isAvailableForShift(nightEmp, nightShiftBad)).toBe(false)
      })
    })
  })

  describe('wouldExceedMaxHours', () => {
    it('returns false if shift fits within max hours', () => {
      const currentAssignedHours = 32
      expect(wouldExceedMaxHours(mockEmployee, mockShift, currentAssignedHours)).toBe(false)
    })

    it('returns true if shift pushes total over max hours', () => {
      const currentAssignedHours = 36
      expect(wouldExceedMaxHours(mockEmployee, mockShift, currentAssignedHours)).toBe(true)
    })

    it('returns false if maxHours is not set (null/undefined)', () => {
      const unlimitedEmp: Employee = { ...mockEmployee, maxHours: null }
      expect(wouldExceedMaxHours(unlimitedEmp, mockShift, 80)).toBe(false)
    })
  })

  describe('hasShiftOnSameDay', () => {
    const existingShifts: Shift[] = [
      { ...mockShift, id: 'shift-a', start: '08:00', end: '12:00', dayOfWeek: 1, weekNumber: 0 },
    ]

    it('returns true if another shift exists on the exact same day', () => {
      const newShift: Shift = {
        ...mockShift,
        start: '16:00',
        end: '18:00',
        dayOfWeek: 1,
        weekNumber: 0,
      }
      expect(hasShiftOnSameDay(newShift, existingShifts)).toBe(true)
    })

    it('returns false if shift is on a different day', () => {
      const newShift: Shift = {
        ...mockShift,
        start: '13:00',
        end: '17:00',
        dayOfWeek: 2,
        weekNumber: 0,
      }
      expect(hasShiftOnSameDay(newShift, existingShifts)).toBe(false)
    })

    it('returns false if shift is on the same dayOfWeek but in a different week', () => {
      const newShift: Shift = {
        ...mockShift,
        start: '11:00',
        end: '15:00',
        dayOfWeek: 1,
        weekNumber: 1,
      }
      expect(hasShiftOnSameDay(newShift, existingShifts)).toBe(false)
    })
  })

  describe('isEligibleForShift', () => {
    it('returns true if passing all constraints', () => {
      expect(isEligibleForShift(mockEmployee, mockShift, [], 0)).toBe(true)
    })

    it('resolves false if double-shifting on the same day', () => {
      const existing: Shift[] = [{ ...mockShift, start: '08:00', end: '12:00' }]
      expect(isEligibleForShift(mockEmployee, mockShift, existing, 0)).toBe(false)
    })

    it('resolves false if unavailable on day', () => {
      const tuesdayShift: Shift = { ...mockShift, dayOfWeek: 2 }
      expect(isEligibleForShift(mockEmployee, tuesdayShift, [], 0)).toBe(false)
    })

    it('resolves false if blowing max hours', () => {
      expect(isEligibleForShift(mockEmployee, mockShift, [], 40)).toBe(false)
    })

    it('resolves false if role does not match', () => {
      const supportShift: Shift = { ...mockShift, role: 'CNA' }
      expect(isEligibleForShift(mockEmployee, supportShift, [], 0)).toBe(false)
    })

    it('resolves true if shift role is "any" wildcard regardless of employee role', () => {
      const anyRoleShift: Shift = { ...mockShift, role: 'any' }
      expect(isEligibleForShift(mockEmployee, anyRoleShift, [], 0)).toBe(true)
    })
  })
})
