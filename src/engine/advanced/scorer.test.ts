import { calculateScheduleScore } from './scorer'
import { Shift, Employee } from '../../types'

describe('Quality Score Calculator', () => {
  it('returns 100 for a perfect schedule', () => {
    // All scheduled, no overtime, perfectly fair distribution
    const employees: Employee[] = [
      {
        id: '1',
        name: 'A',
        role: 'RN',
        targetHours: 8,
        maxHours: 12,
        minHours: 0,
        isFullTime: true,
        availability: [],
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: '2',
        name: 'B',
        role: 'RN',
        targetHours: 8,
        maxHours: 12,
        minHours: 0,
        isFullTime: true,
        availability: [],
        createdAt: 0,
        updatedAt: 0,
      },
    ]

    const shifts: Shift[] = [
      {
        id: 's1',
        dayOfWeek: 1,
        start: '09:00',
        end: '17:00',
        durationHours: 8,
        role: 'RN',
        isAssigned: true,
        employeeId: '1',
      },
      {
        id: 's2',
        dayOfWeek: 2,
        start: '09:00',
        end: '17:00',
        durationHours: 8,
        role: 'RN',
        isAssigned: true,
        employeeId: '2',
      },
    ]

    const score = calculateScheduleScore(employees, shifts, [])
    expect(score).toBe(100)
  })

  it('deducts points for unfilled shifts', () => {
    // Massive deduction for unfilled shifts
    const employees: Employee[] = [
      {
        id: '1',
        name: 'A',
        role: 'RN',
        targetHours: 8,
        maxHours: 12,
        minHours: 0,
        isFullTime: true,
        availability: [],
        createdAt: 0,
        updatedAt: 0,
      },
    ]

    const assigned: Shift[] = []
    const unfilled: Shift[] = [
      {
        id: 's1',
        dayOfWeek: 1,
        start: '09:00',
        end: '17:00',
        durationHours: 8,
        role: 'RN',
        isAssigned: false,
      },
    ]

    const score = calculateScheduleScore(employees, assigned, unfilled)
    expect(score).toBeLessThanOrEqual(75) // 25 point penalty for 1 shift
  })

  it('deducts points for unfair distribution', () => {
    // Both want 8 hours, but one gets 16 and one gets 0
    const employees: Employee[] = [
      {
        id: '1',
        name: 'A',
        role: 'RN',
        targetHours: 8,
        maxHours: 40,
        minHours: 0,
        isFullTime: true,
        availability: [],
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: '2',
        name: 'B',
        role: 'RN',
        targetHours: 8,
        maxHours: 40,
        minHours: 0,
        isFullTime: true,
        availability: [],
        createdAt: 0,
        updatedAt: 0,
      },
    ]

    const shifts: Shift[] = [
      {
        id: 's1',
        dayOfWeek: 1,
        start: '09:00',
        end: '17:00',
        durationHours: 8,
        role: 'RN',
        isAssigned: true,
        employeeId: '1',
      },
      {
        id: 's2',
        dayOfWeek: 2,
        start: '09:00',
        end: '17:00',
        durationHours: 8,
        role: 'RN',
        isAssigned: true,
        employeeId: '1',
      }, // A gets both
    ]

    const score = calculateScheduleScore(employees, shifts, [])
    expect(score).toBeLessThan(100)
    expect(score).toBeGreaterThan(50) // Fairness hurts but is not fatal like unfilled shifts
  })
})
