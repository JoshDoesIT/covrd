import { encodeStateToHash, decodeStateFromHash } from './urlState'
import { createEmployee, createCoverageRequirement, createSchedule } from '../types/factories'

describe('URL State Encoding', () => {
  const sampleEmployee = createEmployee({
    id: 'emp-1',
    name: 'Alice',
    role: 'Cashier',
    maxHoursPerWeek: 40,
  })

  const sampleCoverage = createCoverageRequirement({
    id: 'cov-1',
    name: 'Morning',
    day: 'monday',
    startTime: '09:00',
    endTime: '13:00',
    requiredStaff: 3,
  })

  const sampleSchedule = createSchedule({
    id: 'sched-1',
    name: 'Week 1',
    startDate: '2026-04-06',
    endDate: '2026-04-12',
  })

  describe('encodeStateToHash', () => {
    it('encodes state to a non-empty string', () => {
      const hash = encodeStateToHash({
        employees: [sampleEmployee],
        coverageRequirements: [sampleCoverage],
        schedule: sampleSchedule,
      })

      expect(hash).toBeDefined()
      expect(hash.length).toBeGreaterThan(0)
    })

    it('produces a string safe for URL hash fragments', () => {
      const hash = encodeStateToHash({
        employees: [sampleEmployee],
        coverageRequirements: [sampleCoverage],
        schedule: sampleSchedule,
      })

      // Should not contain characters that need URL encoding
      expect(hash).not.toContain(' ')
      expect(hash).not.toContain('\n')
    })
  })

  describe('decodeStateFromHash', () => {
    it('round-trips state through encode/decode', () => {
      const originalState = {
        employees: [sampleEmployee],
        coverageRequirements: [sampleCoverage],
        schedule: sampleSchedule,
      }

      const hash = encodeStateToHash(originalState)
      const decoded = decodeStateFromHash(hash)

      expect(decoded).not.toBeNull()
      expect(decoded!.employees).toHaveLength(1)
      expect(decoded!.employees[0].name).toBe('Alice')
      expect(decoded!.coverageRequirements).toHaveLength(1)
      expect(decoded!.coverageRequirements[0].name).toBe('Morning')
      expect(decoded!.schedule.name).toBe('Week 1')
    })

    it('returns null for invalid hash', () => {
      const decoded = decodeStateFromHash('totally-not-valid-data!!!')
      expect(decoded).toBeNull()
    })

    it('returns null for empty string', () => {
      const decoded = decodeStateFromHash('')
      expect(decoded).toBeNull()
    })

    it('handles state with multiple employees', () => {
      const employees = [
        createEmployee({ id: 'e1', name: 'Alice', role: 'Cashier' }),
        createEmployee({ id: 'e2', name: 'Bob', role: 'Cook' }),
        createEmployee({ id: 'e3', name: 'Carol', role: 'Manager' }),
      ]

      const state = {
        employees,
        coverageRequirements: [sampleCoverage],
        schedule: sampleSchedule,
      }

      const hash = encodeStateToHash(state)
      const decoded = decodeStateFromHash(hash)

      expect(decoded!.employees).toHaveLength(3)
      expect(decoded!.employees.map((e) => e.name)).toEqual(['Alice', 'Bob', 'Carol'])
    })
  })

  describe('compression', () => {
    it('produces compressed output smaller than raw JSON', () => {
      const employees = Array.from({ length: 20 }, (_, i) =>
        createEmployee({ id: `e${i}`, name: `Employee ${i}`, role: 'Staff' }),
      )

      const state = {
        employees,
        coverageRequirements: [sampleCoverage],
        schedule: sampleSchedule,
      }

      const hash = encodeStateToHash(state)
      const rawJson = JSON.stringify(state)

      // Compressed + base64 should still be smaller than raw JSON for repetitive data
      expect(hash.length).toBeLessThan(rawJson.length)
    })
  })
})
