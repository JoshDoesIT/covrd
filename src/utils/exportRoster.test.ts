import { describe, it, expect } from 'vitest'
import { serializeRosterJSON, deserializeRosterJSON } from './exportRoster'
import { createEmployee } from '../types/factories'

describe('Roster Export/Import Utilities (Story 6.9)', () => {
  const employees = [
    createEmployee({ id: 'e1', name: 'Alice', role: 'Cashier', maxHoursPerWeek: 40 }),
    createEmployee({ id: 'e2', name: 'Bob', role: 'Cook', maxHoursPerWeek: 32 }),
  ]

  describe('serializeRosterJSON', () => {
    it('serializes an employee array to JSON with metadata', () => {
      const json = serializeRosterJSON(employees)
      const parsed = JSON.parse(json)

      expect(parsed.version).toBe(1)
      expect(parsed.exportedAt).toBeDefined()
      expect(parsed.employees).toHaveLength(2)
      expect(parsed.employees[0].name).toBe('Alice')
    })

    it('handles an empty roster', () => {
      const json = serializeRosterJSON([])
      const parsed = JSON.parse(json)

      expect(parsed.employees).toHaveLength(0)
    })
  })

  describe('deserializeRosterJSON', () => {
    it('round-trips through serialize/deserialize', () => {
      const json = serializeRosterJSON(employees)
      const result = deserializeRosterJSON(json)

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Alice')
      expect(result[1].role).toBe('Cook')
    })

    it('throws on invalid JSON', () => {
      expect(() => deserializeRosterJSON('bad')).toThrow()
    })

    it('throws when employees is not an array', () => {
      const bad = JSON.stringify({ employees: 'nope' })
      expect(() => deserializeRosterJSON(bad)).toThrow()
    })

    it('preserves availability and restrictions', () => {
      const detailed = createEmployee({
        id: 'e3',
        name: 'Carol',
        role: 'Manager',
        availability: [{ day: 'monday', blocks: [{ startTime: '08:00', endTime: '16:00' }] }],
        restrictions: [
          {
            id: 'r1',
            description: 'No weekends',
            type: 'cannot-work-days',
            days: ['saturday', 'sunday'],
          },
        ],
      })

      const json = serializeRosterJSON([detailed])
      const result = deserializeRosterJSON(json)

      expect(result[0].availability).toHaveLength(1)
      expect(result[0].restrictions).toHaveLength(1)
      expect(result[0].restrictions[0].description).toBe('No weekends')
    })
  })
})
