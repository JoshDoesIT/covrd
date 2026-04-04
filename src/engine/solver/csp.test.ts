import type { EngineEmployee as Employee, EngineShift as Shift } from '../types'
import { solveSchedule } from './csp'

describe('Constraint Satisfaction Problem Solver', () => {
  const alice: Employee = {
    id: 'emp-1',
    name: 'Alice',
    role: 'RN',
    maxHours: 12,
    minHours: 0,
    targetHours: 8,
    isFullTime: true,
    availability: [],
    createdAt: 0,
    updatedAt: 0,
  }
  const bob: Employee = {
    id: 'emp-2',
    name: 'Bob',
    role: 'RN',
    maxHours: 12,
    minHours: 0,
    targetHours: 8,
    isFullTime: true,
    availability: [],
    createdAt: 0,
    updatedAt: 0,
  }
  const employees = [alice, bob]

  const shift1: Shift = {
    id: 's1',
    dayOfWeek: 1,
    start: '08:00',
    end: '16:00',
    role: 'RN',
    durationHours: 8,
    isAssigned: false,
    weekNumber: 0,
  }
  const shift2: Shift = {
    id: 's2',
    dayOfWeek: 1,
    start: '16:00',
    end: '24:00',
    role: 'RN',
    durationHours: 8,
    isAssigned: false,
    weekNumber: 0,
  }

  it('assigns all shifts to eligible employees', () => {
    // Both Alice and Bob can work. One takes shift 1, one takes shift 2 (to prevent overtime)
    const result = solveSchedule(employees, [shift1, shift2])

    expect(result.success).toBe(true)
    expect(result.assignedShifts).toHaveLength(2)

    // Ensure all are actually assigned to an employee
    for (const shift of result.assignedShifts) {
      expect(shift.isAssigned).toBe(true)
      expect(shift.employeeId).toBeDefined()
    }

    // Since maxHours = 12 and shifts are 8 hours each, one person CANNOT take both.
    const e1 = result.assignedShifts[0].employeeId
    const e2 = result.assignedShifts[1].employeeId
    expect(e1).not.toBe(e2) // Alice and Bob must split the shifts
  })

  it('detects an unsolvable schedule (unsatisfiable constraints)', () => {
    // Both shifts overlap. Max hours for Charlie is 4. No one can work.
    const charlie: Employee = {
      id: 'emp-3',
      name: 'C',
      role: 'RN',
      maxHours: 4,
      minHours: 0,
      targetHours: 4,
      isFullTime: true,
      availability: [],
      createdAt: 0,
      updatedAt: 0,
    }

    const result = solveSchedule([charlie], [shift1, shift2]) // Shifts are 8 hours! Charlie only has 4.

    expect(result.success).toBe(false)
    expect(result.unfilledShifts.length).toBeGreaterThan(0)
  })

  it('correctly handles tracking current hours per employee during tracking', () => {
    // Alice prefers day, Bob prefers night, but here we just test that
    // the backtracking successfully maps the Map of hours stringently.
    const result = solveSchedule([alice], [shift1])
    expect(result.success).toBe(true)
    expect(result.assignedShifts[0].employeeId).toBe('emp-1')
  })

  it('assigns partial schedules when some shifts are permanently impossible (prevents depth-0 domain wipeout)', () => {
    const charlie: Employee = {
      id: 'emp-3',
      name: 'Charlie',
      role: 'RN',
      maxHours: 12,
      minHours: 0,
      targetHours: 8,
      isFullTime: true,
      availability: [],
      createdAt: 0,
      updatedAt: 0,
    }

    // shift1 is standard RN shift. Charlie can work this.
    // impossibleShift requires 'Doctor' role, which Charlie doesn't have.
    // This shift evaluates to 0 candidates immediately.
    const impossibleShift: Shift = {
      ...shift2,
      id: 'impossible-shift',
      role: 'Doctor',
    }

    const result = solveSchedule([charlie], [shift1, impossibleShift])

    // Should not return global success since one shift failed
    expect(result.success).toBe(false)

    // BUT should still output the partial assignment for shift1!
    expect(result.assignedShifts).toHaveLength(1)
    expect(result.assignedShifts[0].id).toBe('s1')

    expect(result.unfilledShifts).toHaveLength(1)
    expect(result.unfilledShifts[0].id).toBe('impossible-shift')
  })
})
