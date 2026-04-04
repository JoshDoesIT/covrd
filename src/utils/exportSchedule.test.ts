import { describe, it, expect } from 'vitest'
import {
  serializeScheduleJSON,
  deserializeScheduleJSON,
  serializeScheduleCSV,
} from './exportSchedule'
import { createEmployee, createCoverageRequirement, createSchedule } from '../types/factories'
import type { ShareableState } from '../stores/urlState'

describe('Schedule Export/Import Utilities', () => {
  const employee = createEmployee({
    id: 'e1',
    name: 'Alice',
    role: 'Cashier',
    maxHoursPerWeek: 40,
  })

  const coverage = createCoverageRequirement({
    id: 'c1',
    date: '2026-04-06',
    startTime: '09:00',
    endTime: '13:00',
    requiredStaff: 2,
  })

  const schedule = createSchedule({
    id: 's1',
    name: 'Week 1',
    startDate: '2026-04-06',
    endDate: '2026-04-12',
    shifts: [
      {
        id: 'sh1',
        day: 'monday',
        startTime: '09:00',
        endTime: '13:00',
        requiredStaff: 1,
      },
    ],
    assignments: [{ id: 'a1', shiftId: 'sh1', employeeId: 'e1', isManual: false }],
    qualityScore: 85,
    unfilledShiftIds: [],
  })

  const state: ShareableState = {
    employees: [employee],
    coverageRequirements: [coverage],
    schedule,
  }

  describe('serializeScheduleJSON (Story 6.1)', () => {
    it('serializes state to a valid JSON string', () => {
      const json = serializeScheduleJSON(state)
      const parsed = JSON.parse(json)

      expect(parsed.employees).toHaveLength(1)
      expect(parsed.employees[0].name).toBe('Alice')
      expect(parsed.coverageRequirements).toHaveLength(1)
      expect(parsed.schedule.name).toBe('Week 1')
    })

    it('includes a version field for forward compatibility', () => {
      const json = serializeScheduleJSON(state)
      const parsed = JSON.parse(json)

      expect(parsed.version).toBe(1)
    })

    it('includes an exportedAt ISO timestamp', () => {
      const json = serializeScheduleJSON(state)
      const parsed = JSON.parse(json)

      expect(parsed.exportedAt).toBeDefined()
      expect(new Date(parsed.exportedAt).getTime()).not.toBeNaN()
    })
  })

  describe('deserializeScheduleJSON (Story 6.2)', () => {
    it('round-trips through serialize/deserialize', () => {
      const json = serializeScheduleJSON(state)
      const result = deserializeScheduleJSON(json)

      expect(result.employees).toHaveLength(1)
      expect(result.employees[0].name).toBe('Alice')
      expect(result.coverageRequirements).toHaveLength(1)
      expect(result.schedule.name).toBe('Week 1')
      expect(result.schedule.assignments).toHaveLength(1)
    })

    it('throws on invalid JSON', () => {
      expect(() => deserializeScheduleJSON('not json')).toThrow()
    })

    it('throws when required fields are missing', () => {
      const partial = JSON.stringify({ employees: [] })
      expect(() => deserializeScheduleJSON(partial)).toThrow()
    })

    it('throws when employees is not an array', () => {
      const bad = JSON.stringify({
        employees: 'nope',
        coverageRequirements: [],
        schedule: {},
      })
      expect(() => deserializeScheduleJSON(bad)).toThrow()
    })
  })

  describe('serializeScheduleCSV (Story 6.3)', () => {
    it('produces a CSV string with header row', () => {
      const csv = serializeScheduleCSV(state)
      const lines = csv.split('\n')

      expect(lines[0]).toBe('Day,Start,End,Employee,Role')
    })

    it('includes one data row per assignment', () => {
      const csv = serializeScheduleCSV(state)
      const lines = csv.trim().split('\n')

      // Header + 1 assignment = 2 lines
      expect(lines.length).toBe(2)
    })

    it('returns header-only CSV when no assignments exist', () => {
      const emptyState: ShareableState = {
        ...state,
        schedule: { ...state.schedule, assignments: [], shifts: [] },
      }
      const csv = serializeScheduleCSV(emptyState)
      const lines = csv.trim().split('\n')

      expect(lines.length).toBe(1)
      expect(lines[0]).toBe('Day,Start,End,Employee,Role')
    })

    it('escapes commas in employee names', () => {
      const commaEmployee = createEmployee({
        id: 'e2',
        name: 'Jones, Alice',
        role: 'Cashier',
      })
      const commaState: ShareableState = {
        employees: [commaEmployee],
        coverageRequirements: [coverage],
        schedule: {
          ...schedule,
          shifts: [
            {
              id: 'sh1',
              day: 'monday',
              startTime: '09:00',
              endTime: '13:00',
              requiredStaff: 1,
            },
          ],
          assignments: [{ id: 'a1', shiftId: 'sh1', employeeId: 'e2', isManual: false }],
        },
      }
      const csv = serializeScheduleCSV(commaState)
      const dataLine = csv.split('\n')[1]

      expect(dataLine).toContain('"Jones, Alice"')
    })
  })
})
