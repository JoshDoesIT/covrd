import type { EngineEmployee as Employee, EngineShift as Shift } from '../types'
import { timeToMinutes } from './time'

/**
 * Checks if an employee is available to work on a specific day.
 * If no explicit availability record exists for the day, assumes available.
 */
export function isAvailableForShift(employee: Employee, shift: Shift): boolean {
  if (!employee.availability || employee.availability.length === 0) {
    return true
  }

  const dayRecord = employee.availability.find((a) => a.dayOfWeek === shift.dayOfWeek)
  if (!dayRecord) {
    return true // Assume available if day not configured
  }

  if (!dayRecord.isAvailable) {
    return false
  }

  if (dayRecord.preferences && dayRecord.preferences.length > 0) {
    const shiftStart = timeToMinutes(shift.start)
    let shiftEnd = timeToMinutes(shift.end)
    if (shiftEnd <= shiftStart) {
      shiftEnd += 1440
    }

    const isContained = dayRecord.preferences.some((pref) => {
      const prefStart = timeToMinutes(pref.start)
      let prefEnd = timeToMinutes(pref.end)
      if (prefEnd <= prefStart) {
        prefEnd += 1440
      }
      return shiftStart >= prefStart && shiftEnd <= prefEnd
    })

    if (!isContained) {
      return false
    }
  }

  return true
}

/**
 * Checks if adding this shift to the current total would exceed the employee's max hours.
 */
export function wouldExceedMaxHours(
  employee: Employee,
  shift: Shift,
  currentHours: number,
): boolean {
  if (employee.maxHours === null || employee.maxHours === undefined) {
    return false
  }

  return currentHours + shift.durationHours > employee.maxHours
}

/**
 * Checks if the proposed shift is on a day the employee is already working.
 * We do not allow double shifts (two shifts on a single day).
 */
export function hasShiftOnSameDay(proposedShift: Shift, existingShifts: Shift[]): boolean {
  return existingShifts.some(
    (s) => s.dayOfWeek === proposedShift.dayOfWeek && s.weekNumber === proposedShift.weekNumber,
  )
}

/**
 * Composite check: Is the employee eligible to work this shift?
 * Checks role, availability, hours, and overlap.
 */
export function isEligibleForShift(
  employee: Employee,
  shift: Shift,
  existingShifts: Shift[],
  currentHoursThisWeek: number,
): boolean {
  // Role mismatch is an immediate hard constraint failure
  // 'any' is a wildcard that matches all roles
  if (shift.role !== 'any' && employee.role !== shift.role) {
    return false
  }

  // Not available to work that day at all
  if (!isAvailableForShift(employee, shift)) {
    return false
  }

  // Adding this shift puts them into overtime / over max bounds
  if (wouldExceedMaxHours(employee, shift, currentHoursThisWeek)) {
    return false
  }

  // Already scheduled at this exact time
  if (hasShiftOnSameDay(shift, existingShifts)) {
    return false
  }

  return true
}
