import { vi, describe, test, expect } from 'vitest'
import { DEMO_EMPLOYEES, DEMO_COVERAGE_REQUIREMENTS, loadDemoDataAsync } from './demoData'

vi.mock('../engine/worker/client', () => ({
  generateScheduleAsync: vi.fn().mockResolvedValue({
    success: true,
    assignedShifts: [
      { id: 'demo-shift-demo-cov-1-0', employeeId: 'demo-emp-1' },
      { id: 'demo-shift-demo-cov-2-0', employeeId: 'demo-emp-2' },
    ],
    unfilledShifts: [],
    totalCost: 0,
    qualityScore: 100,
    metrics: {},
  }),
}))

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
    const uniqueDays = new Set(DEMO_COVERAGE_REQUIREMENTS.map((r) => r.date))
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

  test('loadDemoData returns all three data sets dynamically', async () => {
    const data = await loadDemoDataAsync()
    expect(data.employees).toEqual(DEMO_EMPLOYEES)
    expect(data.coverageRequirements).toEqual(DEMO_COVERAGE_REQUIREMENTS)
    expect(data.schedule.shifts.length).toBeGreaterThan(0)
    expect(data.schedule.assignments.length).toBeGreaterThan(0)
  })
})
