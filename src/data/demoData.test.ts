import { describe, test, expect } from 'vitest'
import {
  DEMO_EMPLOYEES,
  DEMO_COVERAGE_REQUIREMENTS,
  DEMO_SCHEDULE,
  loadDemoData,
} from './demoData'

describe('Demo Data', () => {
  test('provides at least 5 demo employees', () => {
    expect(DEMO_EMPLOYEES.length).toBeGreaterThanOrEqual(5)
  })

  test('all employee IDs are unique', () => {
    const ids = DEMO_EMPLOYEES.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('employees have valid employment types', () => {
    DEMO_EMPLOYEES.forEach((e) => {
      expect(['full-time', 'part-time']).toContain(e.employmentType)
    })
  })

  test('employees have at least some availability', () => {
    const withAvailability = DEMO_EMPLOYEES.filter((e) => e.availability.length > 0)
    expect(withAvailability.length).toBeGreaterThanOrEqual(3)
  })

  test('provides coverage requirements for multiple days', () => {
    expect(DEMO_COVERAGE_REQUIREMENTS.length).toBeGreaterThanOrEqual(5)
    const uniqueDays = new Set(DEMO_COVERAGE_REQUIREMENTS.map((r) => r.day))
    expect(uniqueDays.size).toBeGreaterThanOrEqual(5)
  })

  test('all coverage requirement IDs are unique', () => {
    const ids = DEMO_COVERAGE_REQUIREMENTS.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('coverage requirements have valid time formats', () => {
    const timeRegex = /^\d{2}:\d{2}$/
    DEMO_COVERAGE_REQUIREMENTS.forEach((r) => {
      expect(r.startTime).toMatch(timeRegex)
      expect(r.endTime).toMatch(timeRegex)
    })
  })

  test('provides a demo schedule with assignments', () => {
    expect(DEMO_SCHEDULE).toBeDefined()
    expect(DEMO_SCHEDULE.shifts.length).toBeGreaterThan(0)
    expect(DEMO_SCHEDULE.assignments.length).toBeGreaterThan(0)
  })

  test('schedule assignment employee IDs reference valid demo employees', () => {
    const employeeIds = new Set(DEMO_EMPLOYEES.map((e) => e.id))
    DEMO_SCHEDULE.assignments.forEach((a) => {
      expect(employeeIds.has(a.employeeId)).toBe(true)
    })
  })

  test('schedule assignment shift IDs reference valid demo shifts', () => {
    const shiftIds = new Set(DEMO_SCHEDULE.shifts.map((s) => s.id))
    DEMO_SCHEDULE.assignments.forEach((a) => {
      expect(shiftIds.has(a.shiftId)).toBe(true)
    })
  })

  test('loadDemoData returns all three data sets', () => {
    const data = loadDemoData()
    expect(data.employees).toEqual(DEMO_EMPLOYEES)
    expect(data.coverageRequirements).toEqual(DEMO_COVERAGE_REQUIREMENTS)
    expect(data.schedule).toEqual(DEMO_SCHEDULE)
  })
})
