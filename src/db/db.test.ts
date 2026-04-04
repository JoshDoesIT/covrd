import { describe, test, expect, beforeEach } from 'vitest'
import { covrdDb } from './db'

describe('CovrdDatabase', () => {
  beforeEach(async () => {
    // Clear all tables before each test
    await covrdDb.employees.clear()
    await covrdDb.coverageRequirements.clear()
    await covrdDb.schedules.clear()
  })

  test('exposes all required tables', () => {
    expect(covrdDb.employees).toBeDefined()
    expect(covrdDb.coverageRequirements).toBeDefined()
    expect(covrdDb.schedules).toBeDefined()
  })

  test('stores and retrieves an employee', async () => {
    const employee = {
      id: 'emp-1',
      name: 'Jane Doe',
      role: 'Manager',
      employmentType: 'full-time' as const,
      availability: [],
      maxHoursPerWeek: 40,
      minHoursPerWeek: 0,
      preferredShiftsPerWeek: null,
      preferredTimes: [],
      restrictions: [],
      color: '#6C5CE7',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await covrdDb.employees.put(employee)
    const retrieved = await covrdDb.employees.get('emp-1')
    expect(retrieved).toEqual(employee)
  })

  test('stores and retrieves a coverage requirement', async () => {
    const req = {
      id: 'cov-1',
      date: '2026-04-06',
      startTime: '09:00',
      endTime: '17:00',
      requiredStaff: 2,
    }

    await covrdDb.coverageRequirements.put(req)
    const retrieved = await covrdDb.coverageRequirements.get('cov-1')
    expect(retrieved).toEqual(req)
  })

  test('stores and retrieves a schedule', async () => {
    const schedule = {
      id: 'sched-1',
      name: 'Week 1',
      startDate: '2026-04-01',
      endDate: '2026-04-07',
      shifts: [],
      assignments: [],
      qualityScore: 85,
      unfilledShiftIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await covrdDb.schedules.put(schedule)
    const retrieved = await covrdDb.schedules.get('sched-1')
    expect(retrieved).toEqual(schedule)
  })

  test('bulk-puts and retrieves all employees', async () => {
    const employees = [
      {
        id: 'emp-a',
        name: 'Alice',
        role: 'Staff',
        employmentType: 'full-time' as const,
        availability: [],
        maxHoursPerWeek: 40,
        minHoursPerWeek: 0,
        preferredShiftsPerWeek: null,
        preferredTimes: [],
        restrictions: [],
        color: '#00B894',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'emp-b',
        name: 'Bob',
        role: 'Manager',
        employmentType: 'part-time' as const,
        availability: [],
        maxHoursPerWeek: 20,
        minHoursPerWeek: 0,
        preferredShiftsPerWeek: null,
        preferredTimes: [],
        restrictions: [],
        color: '#E17055',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    await covrdDb.employees.bulkPut(employees)
    const all = await covrdDb.employees.toArray()
    expect(all).toHaveLength(2)
    expect(all.map((e: { name: string }) => e.name).sort()).toEqual(['Alice', 'Bob'])
  })

  test('deletes a record by id', async () => {
    await covrdDb.employees.put({
      id: 'emp-del',
      name: 'ToDelete',
      role: 'Staff',
      employmentType: 'full-time' as const,
      availability: [],
      maxHoursPerWeek: 40,
      minHoursPerWeek: 0,
      preferredShiftsPerWeek: null,
      preferredTimes: [],
      restrictions: [],
      color: '#74B9FF',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    await covrdDb.employees.delete('emp-del')
    const result = await covrdDb.employees.get('emp-del')
    expect(result).toBeUndefined()
  })

  test('clears all data from all tables', async () => {
    await covrdDb.employees.put({
      id: 'emp-clear',
      name: 'ClearMe',
      role: 'Staff',
      employmentType: 'full-time' as const,
      availability: [],
      maxHoursPerWeek: 40,
      minHoursPerWeek: 0,
      preferredShiftsPerWeek: null,
      preferredTimes: [],
      restrictions: [],
      color: '#FDCB6E',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    await covrdDb.purgeAll()
    const count = await covrdDb.employees.count()
    expect(count).toBe(0)
  })
})
