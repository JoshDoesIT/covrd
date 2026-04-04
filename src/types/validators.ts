import type { Employee, CoverageRequirement, TimeBlock } from './index'

/**
 * Validation result.
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/** Regex for "HH:mm" 24-hour time format. */
const TIME_FORMAT = /^([01]\d|2[0-3]):[0-5]\d$/

/**
 * Parse a "HH:mm" string into total minutes since midnight.
 * Returns null if the format is invalid.
 */
function parseTimeToMinutes(time: string): number | null {
  if (!TIME_FORMAT.test(time)) return null
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Validate a TimeBlock has correct format and start < end.
 */
export function validateTimeBlock(block: TimeBlock): ValidationResult {
  const errors: string[] = []

  const startMinutes = parseTimeToMinutes(block.startTime)
  const endMinutes = parseTimeToMinutes(block.endTime)

  if (startMinutes === null) {
    errors.push(`Invalid start time format: "${block.startTime}". Use "HH:mm" (24-hour).`)
  }
  if (endMinutes === null) {
    errors.push(`Invalid end time format: "${block.endTime}". Use "HH:mm" (24-hour).`)
  }
  if (startMinutes !== null && endMinutes !== null && startMinutes >= endMinutes) {
    errors.push(`Start time (${block.startTime}) must be before end time (${block.endTime}).`)
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate an Employee has all required fields and sensible values.
 */
export function validateEmployee(employee: Employee): ValidationResult {
  const errors: string[] = []

  if (!employee.name || employee.name.trim().length === 0) {
    errors.push('Name is required')
  }
  if (!employee.role || employee.role.trim().length === 0) {
    errors.push('Role is required')
  }
  if (employee.maxHoursPerWeek < 0) {
    errors.push('Max hours per week cannot be negative')
  }
  if (employee.minHoursPerWeek < 0) {
    errors.push('Min hours per week cannot be negative')
  }
  if (employee.maxHoursPerWeek < employee.minHoursPerWeek) {
    errors.push('Max hours must be greater than or equal to min hours')
  }

  for (const avail of employee.availability) {
    for (const block of avail.blocks) {
      const blockResult = validateTimeBlock(block)
      if (!blockResult.valid) {
        errors.push(`Availability on ${avail.day}: ${blockResult.errors.join(', ')}`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate a CoverageRequirement.
 */
export function validateCoverageRequirement(req: CoverageRequirement): ValidationResult {
  const errors: string[] = []

  if (!req.date || !/^\d{4}-\d{2}-\d{2}$/.test(req.date)) {
    errors.push('A valid ISO date (YYYY-MM-DD) is required')
  }
  if (req.requiredStaff < 1) {
    errors.push('Required staff must be at least 1')
  }

  const timeResult = validateTimeBlock({ startTime: req.startTime, endTime: req.endTime })
  if (!timeResult.valid) {
    errors.push(...timeResult.errors)
  }

  return { valid: errors.length === 0, errors }
}
