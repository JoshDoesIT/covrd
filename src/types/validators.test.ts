import { validateTimeBlock, validateEmployee, validateCoverageRequirement } from './validators'
import type { TimeBlock } from './index'
import { createEmployee, createCoverageRequirement } from './factories'

describe('Validators', () => {
  describe('validateTimeBlock', () => {
    it('accepts a valid time block', () => {
      const block: TimeBlock = { startTime: '09:00', endTime: '17:00' }
      expect(validateTimeBlock(block)).toEqual({ valid: true, errors: [] })
    })

    it('rejects when start equals end', () => {
      const block: TimeBlock = { startTime: '09:00', endTime: '09:00' }
      const result = validateTimeBlock(block)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('rejects when start is after end', () => {
      const block: TimeBlock = { startTime: '17:00', endTime: '09:00' }
      const result = validateTimeBlock(block)
      expect(result.valid).toBe(false)
    })

    it('rejects invalid time format', () => {
      const block: TimeBlock = { startTime: '9am', endTime: '5pm' }
      const result = validateTimeBlock(block)
      expect(result.valid).toBe(false)
    })

    it('rejects out-of-range values', () => {
      const block: TimeBlock = { startTime: '25:00', endTime: '17:00' }
      const result = validateTimeBlock(block)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateEmployee', () => {
    it('accepts a valid employee', () => {
      const employee = createEmployee({ name: 'Alice', role: 'Cashier' })
      const result = validateEmployee(employee)
      expect(result.valid).toBe(true)
    })

    it('rejects an employee with empty name', () => {
      const employee = createEmployee({ name: '', role: 'Cashier' })
      const result = validateEmployee(employee)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Name is required')
    })

    it('rejects an employee with empty role', () => {
      const employee = createEmployee({ name: 'Alice', role: '' })
      const result = validateEmployee(employee)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Role is required')
    })

    it('rejects negative max hours', () => {
      const employee = createEmployee({ name: 'Bob', role: 'Cook', maxHoursPerWeek: -5 })
      const result = validateEmployee(employee)
      expect(result.valid).toBe(false)
    })

    it('rejects max hours less than min hours', () => {
      const employee = createEmployee({
        name: 'Carol',
        role: 'Server',
        maxHoursPerWeek: 10,
        minHoursPerWeek: 20,
      })
      const result = validateEmployee(employee)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateCoverageRequirement', () => {
    it('accepts a valid coverage requirement', () => {
      const req = createCoverageRequirement({
        name: 'Morning',
        day: 'monday',
        startTime: '09:00',
        endTime: '13:00',
        requiredStaff: 3,
      })
      expect(validateCoverageRequirement(req).valid).toBe(true)
    })

    it('rejects zero required staff', () => {
      const req = createCoverageRequirement({
        name: 'Morning',
        day: 'monday',
        startTime: '09:00',
        endTime: '13:00',
        requiredStaff: 0,
      })
      const result = validateCoverageRequirement(req)
      expect(result.valid).toBe(false)
    })

    it('rejects empty name', () => {
      const req = createCoverageRequirement({
        name: '',
        day: 'monday',
        startTime: '09:00',
        endTime: '13:00',
        requiredStaff: 2,
      })
      const result = validateCoverageRequirement(req)
      expect(result.valid).toBe(false)
    })
  })
})
