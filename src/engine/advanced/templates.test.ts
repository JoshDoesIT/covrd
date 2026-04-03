import { generateShiftsFromTemplate } from './templates'
import type { EngineCoverageRequirement as CoverageRequirement, EngineShift as Shift } from '../types'

describe('Template Expansion', () => {
  it('expands coverage requirements into individual shift permutations', () => {
    const requirements: CoverageRequirement[] = [
      {
        id: 'r1',
        dayOfWeek: 1, // Monday
        start: '09:00',
        end: '17:00',
        role: 'RN',
        headcount: 2, // We need TWO people to cover this window
      },
    ]

    const shifts: Shift[] = generateShiftsFromTemplate(requirements)

    expect(shifts.length).toBe(2) // Should have exactly 2 distinct shift slots generated

    expect(shifts[0].role).toBe('RN')
    expect(shifts[0].isAssigned).toBe(false)

    // IDs should be deterministic based on the req id + index
    expect(shifts[0].id).toBe('r1-0')
    expect(shifts[1].id).toBe('r1-1')

    // Dates should map if we want to store absolute day info,
    // although our CSP solver right now mainly cares about `dayOfWeek`.
    // We'll verify dayOfWeek maps cleanly.
    expect(shifts[0].dayOfWeek).toBe(1)
  })
})
