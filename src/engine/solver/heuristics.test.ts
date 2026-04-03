import type { EngineEmployee as Employee, EngineShift as Shift } from '../types'
import { sortShiftsByMRV, sortCandidatesByFairness } from './heuristics'

describe('Solver Heuristics', () => {
  describe('MRV (Minimum Remaining Values)', () => {
    const shift1: Shift = {
      id: 's1',
      dayOfWeek: 1,
      start: '09:00',
      end: '17:00',
      role: 'RN',
      durationHours: 8,
      isAssigned: false,
    }
    const shift2: Shift = {
      id: 's2',
      dayOfWeek: 2,
      start: '09:00',
      end: '17:00',
      role: 'RN',
      durationHours: 8,
      isAssigned: false,
    }
    const shift3: Shift = {
      id: 's3',
      dayOfWeek: 3,
      start: '09:00',
      end: '17:00',
      role: 'RN',
      durationHours: 8,
      isAssigned: false,
    }

    it('sorts shifts ascending by number of eligible candidates', () => {
      // Map shift id to number of candidates
      const candidateCounts = new Map<string, number>([
        ['s1', 5], // 5 people can work this
        ['s2', 1], // Very constrained! Only 1 person can work this
        ['s3', 3], // 3 people can work this
      ])

      const sorted = sortShiftsByMRV([shift1, shift2, shift3], candidateCounts)

      // Expected order: hardest to fill (s2) to easiest (s1)
      expect(sorted[0].id).toBe('s2')
      expect(sorted[1].id).toBe('s3')
      expect(sorted[2].id).toBe('s1')
    })

    it('uses duration as a tie-breaker (longer shifts first)', () => {
      const longShift = { ...shift2, durationHours: 12 }
      const shortShift = { ...shift3, durationHours: 4 }

      const counts = new Map<string, number>([
        ['s1', 5],
        ['s2', 2], // Both s2 and s3 have 2 candidates
        ['s3', 2],
      ])

      const sorted = sortShiftsByMRV([shift1, longShift, shortShift], counts)
      expect(sorted[0].id).toBe('s2') // Longest tied wins
      expect(sorted[1].id).toBe('s3')
      expect(sorted[2].id).toBe('s1')
    })
  })

  describe('Fairness Scoring (LCV)', () => {
    const emp1: Employee = {
      id: 'e1',
      name: 'A',
      role: 'RN',
      maxHours: 40,
      minHours: 0,
      targetHours: 36,
      isFullTime: true,
      availability: [],
      createdAt: 0,
      updatedAt: 0,
    }
    const emp2: Employee = {
      id: 'e2',
      name: 'B',
      role: 'RN',
      maxHours: 40,
      minHours: 0,
      targetHours: 36,
      isFullTime: true,
      availability: [],
      createdAt: 0,
      updatedAt: 0,
    }
    const emp3: Employee = {
      id: 'e3',
      name: 'C',
      role: 'RN',
      maxHours: 40,
      minHours: 0,
      targetHours: 36,
      isFullTime: true,
      availability: [],
      createdAt: 0,
      updatedAt: 0,
    }

    it('prioritizes employees furthest from their target hours', () => {
      const currentHours = new Map<string, number>([
        ['e1', 30], // Needs 6 more
        ['e2', 0], // Needs 36 more (highest priority)
        ['e3', 36], // Exact target (lowest priority)
      ])

      const sorted = sortCandidatesByFairness([emp1, emp2, emp3], currentHours)
      expect(sorted[0].id).toBe('e2')
      expect(sorted[1].id).toBe('e1')
      expect(sorted[2].id).toBe('e3')
    })
  })
})
