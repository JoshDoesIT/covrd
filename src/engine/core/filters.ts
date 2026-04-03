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
  currentHourTotals: Map<string, Map<number, number>>, // employeeId -> weekNumber -> hours
): Employee[] {
  return employees.filter((employee) => {
    const existing = existingAssignments.get(employee.id) || []

    // Retrieve hours for specifically THIS shift's week
    const empWeekHoursMap = currentHourTotals.get(employee.id) || new Map<number, number>()
    const currentHoursThisWeek = empWeekHoursMap.get(shift.weekNumber) || 0

    return isEligibleForShift(employee, shift, existing, currentHoursThisWeek)
  })
}
