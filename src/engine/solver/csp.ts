import type { EngineEmployee as Employee, EngineShift as Shift } from '../types'
import { getEligibleCandidates } from '../core/filters'
import { sortShiftsByMRV, sortCandidatesByFairness } from './heuristics'

export type SolveResult = {
  success: boolean
  assignedShifts: Shift[]
  unfilledShifts: Shift[]
}

/**
 * Context passed through the recursive calls to track the best partial solution
 * in case a complete solution is mathematically impossible and we time out.
 */
type SearchContext = {
  startTime: number
  timeoutMs: number
  bestAssignedCount: number
  bestAssignments: Map<string, Shift[]>
  timedOut: boolean
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

  // Pre-filter shifts that are permanently impossible (0 candidates with empty schedule).
  // If we don't, they trigger a depth-0 domain wipeout causing the solver to assign absolutely nothing.
  const fillableShifts: Shift[] = []

  for (const shift of unassignedShifts) {
    const baseEligible = getEligibleCandidates(
      employees,
      shift,
      existingAssignments,
      currentHourTotals,
    )
    if (baseEligible.length > 0) {
      fillableShifts.push(shift)
    }
  }

  const context: SearchContext = {
    startTime: Date.now(),
    timeoutMs: 10000,
    bestAssignedCount: -1,
    bestAssignments: new Map(),
    timedOut: false,
  }

  // Recursively solve using only the shifts that have at least one viable candidate initially
  const success = backtrack(
    fillableShifts,
    employees,
    existingAssignments,
    currentHourTotals,
    context,
  )

  if (success || context.bestAssignments.size > 0) {
    // Reconstruct the assigned shifts list either from complete or best partial
    const finalShifts: Shift[] = []
    const sourceAssignments = success ? existingAssignments : context.bestAssignments

    for (const empshifts of sourceAssignments.values()) {
      finalShifts.push(...empshifts)
    }

    // Filter out the shifts that were assigned to figure out what was unfilled
    const assignedIds = new Set(finalShifts.map((s) => s.id))
    const finalUnfilled = shifts.filter((s) => !assignedIds.has(s.id))

    return {
      // It's only a true absolute success if there are no unfilled shifts.
      // Partial assignments flow through regardless into the generated schedule.
      success: finalUnfilled.length === 0,
      assignedShifts: finalShifts,
      unfilledShifts: finalUnfilled,
    }
  }

  // If we fail completely (no shifts could be scheduled at all)
  return {
    success: false,
    assignedShifts: [],
    unfilledShifts: unassignedShifts,
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
  ctx: SearchContext,
): boolean {
  if (ctx.timedOut) return false

  if (Date.now() - ctx.startTime > ctx.timeoutMs) {
    ctx.timedOut = true
    return false // Unwind the stack gracefully without throwing
  }

  // Track the best partial assignment seen so far
  let assignedCount = 0
  for (const list of assignments.values()) assignedCount += list.length

  if (assignedCount > ctx.bestAssignedCount) {
    ctx.bestAssignedCount = assignedCount
    ctx.bestAssignments.clear()
    for (const [empId, list] of assignments.entries()) {
      // Clone the shift objects so backtracking doesn't wipe them
      ctx.bestAssignments.set(
        empId,
        list.map((s) => ({ ...s })),
      )
    }
  }

  if (unassignedShifts.length === 0) {
    return true // All scheduled successfully
  }

  // Forward Checking & Optimization:
  // Calculate who can work what shift right now to build the domains.
  // Shifts with zero candidates are skipped (unfillable given current state)
  // rather than triggering a full backtrack, which would unwind all prior
  // successful assignments and cause the solver to time out on multi-week schedules.
  const domains = new Map<string, Employee[]>()
  const solvableShifts: Shift[] = []

  for (const shift of unassignedShifts) {
    const eligible = getEligibleCandidates(employees, shift, assignments, hourTotals)
    if (eligible.length === 0) {
      // This shift cannot be filled with the current assignment state.
      // Skip it — it will appear in the unfilled list at the end.
      continue
    }
    domains.set(shift.id, eligible)
    solvableShifts.push(shift)
  }

  if (solvableShifts.length === 0) {
    return true // Everything that CAN be assigned IS assigned
  }

  // Heuristic: MRV. Pick the shift with the fewest options (hardest to fill).
  const candidateCounts = new Map<string, number>()
  for (const [shiftId, emps] of domains.entries()) {
    candidateCounts.set(shiftId, emps.length)
  }

  const sortedShifts = sortShiftsByMRV(solvableShifts, candidateCounts)
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
    const success = backtrack(remaining, employees, assignments, hourTotals, ctx)

    if (success) {
      return true
    }

    if (ctx.timedOut) {
      // Stop exploring alternative branches
      return false
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
