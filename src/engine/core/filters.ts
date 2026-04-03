import type { EngineEmployee as Employee, EngineShift as Shift } from '../types'
import { isEligibleForShift } from './validators'

/**
 * Given a list of all employees and the current state of the schedule,
 * returns only the employees who are legally allowed to work this shift.
 */
export function getEligibleCandidates(
  employees: Employee[],
  shift: Shift,
  existingAssignments: Map<string, Shift[]>,
  currentHourTotals: Map<string, number>,
): Employee[] {
  return employees.filter((employee) => {
    const existing = existingAssignments.get(employee.id) || []
    const currentHours = currentHourTotals.get(employee.id) || 0

    return isEligibleForShift(employee, shift, existing, currentHours)
  })
}
