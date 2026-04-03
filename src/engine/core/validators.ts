import type { EngineEmployee as Employee, EngineShift as Shift } from '../types'
import { isOverlapping } from './time'

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

  return dayRecord.isAvailable
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
 * Checks if the proposed shift overlaps with any of the employee's existing shifts.
 */
export function hasOverlappingShift(proposedShift: Shift, existingShifts: Shift[]): boolean {
  // Only check shifts on the same day (or adjacent overnight days logic could be added here later if needed)
  const sameDayShifts = existingShifts.filter((s) => s.dayOfWeek === proposedShift.dayOfWeek)

  for (const existing of sameDayShifts) {
    if (isOverlapping(proposedShift, existing)) {
      return true
    }
  }

  return false
}

/**
 * Composite check: Is the employee eligible to work this shift?
 * Checks role, availability, hours, and overlap.
 */
export function isEligibleForShift(
  employee: Employee,
  shift: Shift,
  existingShifts: Shift[],
  currentHours: number,
): boolean {
  // Role mismatch is an immediate hard constraint failure
  if (employee.role !== shift.role) {
    return false
  }

  // Not available to work that day at all
  if (!isAvailableForShift(employee, shift)) {
    return false
  }

  // Adding this shift puts them into overtime / over max bounds
  if (wouldExceedMaxHours(employee, shift, currentHours)) {
    return false
  }

  // Already scheduled at this exact time
  if (hasOverlappingShift(shift, existingShifts)) {
    return false
  }

  return true
}
