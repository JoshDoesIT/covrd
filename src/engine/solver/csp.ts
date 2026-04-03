import type { EngineEmployee as Employee, EngineShift as Shift } from '../types'
import { getEligibleCandidates } from '../core/filters'
import { sortShiftsByMRV, sortCandidatesByFairness } from './heuristics'

export type SolveResult = {
  success: boolean
  assignedShifts: Shift[]
  unfilledShifts: Shift[]
}

/**
 * Constraint Satisfaction Problem (CSP) Solver for the Schedule.
 * It uses backtracking, MRV heuristics, and forward checking.
 */
export function solveSchedule(employees: Employee[], targetShifts: Shift[]): SolveResult {
  // Deep clone to avoid mutating application state until success
  const shifts = targetShifts.map((s) => ({ ...s }))
  const existingAssignments = new Map<string, Shift[]>()
  const currentHourTotals = new Map<string, Map<number, number>>()

  const unassignedShifts = shifts.filter((s) => !s.isAssigned)

  // Recursively solve
  const success = backtrack(unassignedShifts, employees, existingAssignments, currentHourTotals)

  if (success) {
    // Reconstruct the assigned shifts list
    const finalShifts: Shift[] = []
    for (const empshifts of existingAssignments.values()) {
      finalShifts.push(...empshifts)
    }

    return {
      success: true,
      assignedShifts: finalShifts,
      unfilledShifts: [],
    }
  }

  // If we fail, return what we have (nothing since it reverted) and flag all as unfilled
  return {
    success: false,
    assignedShifts: [],
    unfilledShifts: unassignedShifts, // All failed in this simplified non-partial test logic
  }
}

/**
 * Recursive backtracking algorithm
 */
function backtrack(
  unassignedShifts: Shift[],
  employees: Employee[],
  assignments: Map<string, Shift[]>,
  hourTotals: Map<string, Map<number, number>>,
): boolean {
  if (unassignedShifts.length === 0) {
    return true // All scheduled successfully
  }

  // Forward Checking & Optimization:
  // Calculate who can work what shift right now to build the domains.
  const domains = new Map<string, Employee[]>()
  for (const shift of unassignedShifts) {
    const eligible = getEligibleCandidates(employees, shift, assignments, hourTotals)
    if (eligible.length === 0) {
      // Domain wipeout! A shift cannot be filled given current assignments.
      // Conflict-directed failure: backjump immediately.
      return false
    }
    domains.set(shift.id, eligible)
  }

  // Heuristic: MRV. Pick the shift with the fewest options (hardest to fill).
  const candidateCounts = new Map<string, number>()
  for (const [shiftId, emps] of domains.entries()) {
    candidateCounts.set(shiftId, emps.length)
  }

  const sortedShifts = sortShiftsByMRV(unassignedShifts, candidateCounts)
  const shiftToAssign = sortedShifts[0]

  // Heuristic: LCV/Fairness + Consecutive Days
  const rawCandidates = domains.get(shiftToAssign.id) ?? []
  const candidates = sortCandidatesByFairness(rawCandidates, hourTotals, shiftToAssign, assignments)

  // Try each candidate
  for (const candidate of candidates) {
    // Assign
    shiftToAssign.isAssigned = true
    shiftToAssign.employeeId = candidate.id

    const empList = assignments.get(candidate.id) ?? []
    empList.push(shiftToAssign)
    assignments.set(candidate.id, empList)

    const empWeekMap = hourTotals.get(candidate.id) ?? new Map<number, number>()
    const curHours = empWeekMap.get(shiftToAssign.weekNumber) ?? 0
    empWeekMap.set(shiftToAssign.weekNumber, curHours + shiftToAssign.durationHours)
    hourTotals.set(candidate.id, empWeekMap)

    // Recurse with shift removed
    const remaining = unassignedShifts.filter((s) => s.id !== shiftToAssign.id)
    const success = backtrack(remaining, employees, assignments, hourTotals)

    if (success) {
      return true
    }

    // Backtrack (revert assignment)
    shiftToAssign.isAssigned = false
    shiftToAssign.employeeId = undefined

    empList.pop() // remove last
    assignments.set(candidate.id, empList)
    empWeekMap.set(shiftToAssign.weekNumber, curHours)
    hourTotals.set(candidate.id, empWeekMap)
  }

  // No candidates worked, must backtrack up the tree
  return false
}
