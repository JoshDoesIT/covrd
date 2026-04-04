import {
  createEmployee,
  createCoverageRequirement,
  createShift,
  createSchedule,
  createConstraint,
} from './factories'

describe('Entity Factories', () => {
  describe('createEmployee', () => {
    it('creates an employee with required fields', () => {
      const employee = createEmployee({ name: 'Alice', role: 'Cashier' })

      expect(employee.name).toBe('Alice')
      expect(employee.role).toBe('Cashier')
      expect(employee.id).toBeDefined()
      expect(employee.id.length).toBeGreaterThan(0)
    })

    it('defaults to full-time with 40 max hours', () => {
      const employee = createEmployee({ name: 'Bob', role: 'Manager' })

      expect(employee.employmentType).toBe('full-time')
      expect(employee.maxHoursPerWeek).toBe(40)
    })

    it('defaults to zero min hours and empty availability', () => {
      const employee = createEmployee({ name: 'Carol', role: 'Server' })

      expect(employee.minHoursPerWeek).toBe(0)
      expect(employee.availability).toEqual([])
      expect(employee.restrictions).toEqual([])
      expect(employee.preferredTimes).toEqual([])
    })

    it('allows overriding defaults', () => {
      const employee = createEmployee({
        name: 'Dan',
        role: 'Cook',
        employmentType: 'part-time',
        maxHoursPerWeek: 20,
      })

      expect(employee.employmentType).toBe('part-time')
      expect(employee.maxHoursPerWeek).toBe(20)
    })

    it('assigns unique IDs to each employee', () => {
      const a = createEmployee({ name: 'A', role: 'R' })
      const b = createEmployee({ name: 'B', role: 'R' })

      expect(a.id).not.toBe(b.id)
    })

    it('sets createdAt and updatedAt timestamps', () => {
      const employee = createEmployee({ name: 'Eve', role: 'Host' })

      expect(employee.createdAt).toBeDefined()
      expect(employee.updatedAt).toBeDefined()
      expect(new Date(employee.createdAt).getTime()).not.toBeNaN()
    })

    it('assigns a color', () => {
      const employee = createEmployee({ name: 'Fay', role: 'Host' })

      expect(employee.color).toBeDefined()
      expect(employee.color.startsWith('#')).toBe(true)
    })
  })

  describe('createCoverageRequirement', () => {
    it('creates a coverage requirement with required fields', () => {
      const req = createCoverageRequirement({
        date: '2026-04-06',
        startTime: '09:00',
        endTime: '13:00',
        requiredStaff: 3,
      })

      expect(req.date).toBe('2026-04-06')
      expect(req.startTime).toBe('09:00')
      expect(req.endTime).toBe('13:00')
      expect(req.requiredStaff).toBe(3)
      expect(req.id).toBeDefined()
    })
  })

  describe('createShift', () => {
    it('creates a shift with required fields', () => {
      const shift = createShift({
        day: 'tuesday',
        startTime: '08:00',
        endTime: '16:00',
        requiredStaff: 2,
      })

      expect(shift.day).toBe('tuesday')
      expect(shift.startTime).toBe('08:00')
      expect(shift.endTime).toBe('16:00')
      expect(shift.requiredStaff).toBe(2)
      expect(shift.id).toBeDefined()
    })
  })

  describe('createSchedule', () => {
    it('creates an empty schedule with date range', () => {
      const schedule = createSchedule({
        name: 'Week 1',
        startDate: '2026-04-06',
        endDate: '2026-04-12',
      })

      expect(schedule.name).toBe('Week 1')
      expect(schedule.startDate).toBe('2026-04-06')
      expect(schedule.endDate).toBe('2026-04-12')
      expect(schedule.shifts).toEqual([])
      expect(schedule.assignments).toEqual([])
      expect(schedule.qualityScore).toBeNull()
      expect(schedule.unfilledShiftIds).toEqual([])
    })
  })

  describe('createConstraint', () => {
    it('creates a hard constraint', () => {
      const constraint = createConstraint({
        name: 'Max 40 hours',
        type: 'hard',
        rule: { kind: 'max-hours', maxHours: 40 },
      })

      expect(constraint.name).toBe('Max 40 hours')
      expect(constraint.type).toBe('hard')
      expect(constraint.enabled).toBe(true)
      expect(constraint.rule).toEqual({ kind: 'max-hours', maxHours: 40 })
    })

    it('creates a soft constraint', () => {
      const constraint = createConstraint({
        name: 'Max 5 consecutive days',
        type: 'soft',
        rule: { kind: 'max-consecutive-days', maxDays: 5 },
      })

      expect(constraint.name).toBe('Max 5 consecutive days')
      expect(constraint.type).toBe('soft')
      expect(constraint.enabled).toBe(true)
      expect(constraint.rule).toEqual({ kind: 'max-consecutive-days', maxDays: 5 })
    })
  })
})
