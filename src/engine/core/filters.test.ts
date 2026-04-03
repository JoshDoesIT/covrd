import { Employee, Shift } from '../../types'
import { getEligibleCandidates } from './filters'

describe('Eligibility Filters', () => {
  const alice: Employee = {
    id: 'emp-1',
    name: 'Alice',
    role: 'RN',
    maxHours: 40,
    minHours: 0,
    targetHours: 36,
    isFullTime: true,
    availability: [{ dayOfWeek: 1, isAvailable: true, preferences: [] }],
    createdAt: 0,
    updatedAt: 0,
  }

  const bob: Employee = {
    id: 'emp-2',
    name: 'Bob',
    role: 'RN',
    maxHours: 40,
    minHours: 0,
    targetHours: 36,
    isFullTime: true,
    availability: [{ dayOfWeek: 1, isAvailable: false, preferences: [] }], // Unavailable!
    createdAt: 0,
    updatedAt: 0,
  }

  const charlie: Employee = {
    id: 'emp-3',
    name: 'Charlie',
    role: 'CNA', // Wrong role!
    maxHours: 40,
    minHours: 0,
    targetHours: 36,
    isFullTime: true,
    availability: [{ dayOfWeek: 1, isAvailable: true, preferences: [] }],
    createdAt: 0,
    updatedAt: 0,
  }

  const shift: Shift = {
    id: 'shift-1',
    dayOfWeek: 1,
    start: '09:00',
    end: '17:00',
    role: 'RN',
    durationHours: 8,
    isAssigned: false,
  }

  it('filters out employees who fail hard constraints', () => {
    // Pass empty arrays for current assignments
    const candidates = getEligibleCandidates([alice, bob, charlie], shift, new Map(), new Map())

    // Only Alice is eligible (Bob is unavailable, Charlie is wrong role)
    expect(candidates).toHaveLength(1)
    expect(candidates[0].id).toBe('emp-1')
  })

  it('filters out employees who are already scheduled at the same time', () => {
    // Alice is already working a conflicting shift
    const existingShifts = new Map<string, Shift[]>()
    existingShifts.set(alice.id, [
      {
        id: 'shift-overlap',
        dayOfWeek: 1,
        start: '08:00',
        end: '12:00',
        role: 'RN',
        durationHours: 4,
        isAssigned: true,
        employeeId: alice.id,
      },
    ])

    const currentHours = new Map<string, number>()
    currentHours.set(alice.id, 4)

    const candidates = getEligibleCandidates([alice], shift, existingShifts, currentHours)
    expect(candidates).toHaveLength(0) // Alice filtered out due to overlap
  })
})
