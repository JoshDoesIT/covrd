import type { EngineEmployee as Employee, EngineShift as Shift } from '../types'

/**
 * Minimum Remaining Values (MRV) Heuristic
 * Sorts shifts so the hardest to fill (fewest candidates) are solved first.
 * Ties are broken by duration (longest shifts scheduled first).
 */
export function sortShiftsByMRV(shifts: Shift[], candidateCounts: Map<string, number>): Shift[] {
  return [...shifts].sort((a, b) => {
    const countA = candidateCounts.get(a.id) ?? 0
    const countB = candidateCounts.get(b.id) ?? 0

    if (countA !== countB) {
      return countA - countB // Ascending: smallest domains first
    }

    // Tie-breaker: Longer shifts are generally harder to place than shorter ones
    return b.durationHours - a.durationHours
  })
}

/**
 * Least Constraining Value (LCV) / Fairness Heuristic
 * Prioritizes employees who are furthest from their target hours.
 * By assigning to them first, we balance the schedule and preserve
 * the hours of people who are close to hitting overtime.
 */
function getAbsoluteDayIndex(weekNum: number, dayOfWeek: number): number {
  // Our weeks start on Monday. DAY_MAP makes Sunday = 0, Monday = 1...
  // Normalize so Monday = 0, Tuesday = 1, ..., Sunday = 6
  const normalizedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  return weekNum * 7 + normalizedDay
}

function getClumpingModifier(assignedDays: number[], targetDay: number): number {
  if (assignedDays.length === 0) return 0

  if (assignedDays.includes(targetDay)) return -2000
  
  const proposedDays = [...new Set([...assignedDays, targetDay])].sort((a,b) => a - b)
  
  let isolatedGaps = 0
  let clusters = 1
  for (let i = 1; i < proposedDays.length; i++) {
    const diff = proposedDays[i] - proposedDays[i-1]
    if (diff > 1) clusters++
    if (diff === 2) isolatedGaps++ // A diff of 2 means exactly 1 missing day (an isolated day off!)
  }

  const currentDays = [...new Set(assignedDays)].sort((a,b) => a - b)
  let currentIsolatedGaps = 0
  let currentClusters = 1
  for (let i = 1; i < currentDays.length; i++) {
    const diff = currentDays[i] - currentDays[i-1]
    if (diff > 1) currentClusters++
    if (diff === 2) currentIsolatedGaps++
  }

  // If assigning this shift CREATES a new isolated gap, VETO it. This is the root cause of fragmented off-days.
  if (isolatedGaps > currentIsolatedGaps) {
    return -2000
  }

  // If assigning this shift CLOSES an isolated gap (e.g. they had [0, 2] and we assign 1), REWARD IT massively!
  // This causes the solver to mathematically self-heal any fragmented schedules that were forced by limited staff availability
  if (isolatedGaps < currentIsolatedGaps) {
    return 2000
  }

  if (clusters < currentClusters) return 1000 // Bridging a larger gap into a single cluster
  if (clusters === currentClusters) return 500 // Extending an existing contiguous block seamlessly
  if (clusters > currentClusters) return -100 // Starting a new contiguous block (acceptable if gap > 1, but still worse than extending)
  
  return 0
}

function getConsistencyModifier(assignedShifts: Shift[], targetShift: Shift): number {
  if (assignedShifts.length === 0) return 0

  // Check if they worked this exact day of the week in any OTHER week
  const workedSameDayInOtherWeek = assignedShifts.some(
    s => s.weekNumber !== targetShift.weekNumber && s.dayOfWeek === targetShift.dayOfWeek
  )

  if (workedSameDayInOtherWeek) {
    // Massive bonus to establish repeating schedules across multi-week horizons
    return 600 
  }

  return 0
}

export function sortCandidatesByFairness(
  candidates: Employee[],
  hourTotals: Map<string, Map<number, number>>,
  shiftToAssign: Shift,
  assignments: Map<string, Shift[]>
): Employee[] {
  const targetDayIndex = getAbsoluteDayIndex(shiftToAssign.weekNumber, shiftToAssign.dayOfWeek)

  return [...candidates].sort((a, b) => {
    const empWeekMapA = hourTotals.get(a.id) ?? new Map<number, number>()
    const hoursA = empWeekMapA.get(shiftToAssign.weekNumber) ?? 0
    const deficitA = a.targetHours - hoursA

    const empWeekMapB = hourTotals.get(b.id) ?? new Map<number, number>()
    const hoursB = empWeekMapB.get(shiftToAssign.weekNumber) ?? 0
    const deficitB = b.targetHours - hoursB

    const assignedShiftsA = assignments.get(a.id) ?? []
    const assignedDaysA = assignedShiftsA.map(s => getAbsoluteDayIndex(s.weekNumber, s.dayOfWeek))
    const clumpModifierA = getClumpingModifier(assignedDaysA, targetDayIndex)
    const consistencyModifierA = getConsistencyModifier(assignedShiftsA, shiftToAssign)

    const assignedShiftsB = assignments.get(b.id) ?? []
    const assignedDaysB = assignedShiftsB.map(s => getAbsoluteDayIndex(s.weekNumber, s.dayOfWeek))
    const clumpModifierB = getClumpingModifier(assignedDaysB, targetDayIndex)
    const consistencyModifierB = getConsistencyModifier(assignedShiftsB, shiftToAssign)

    // Deficit is primary metric (10pts per missing hour).
    const scoreA = (deficitA * 10) + clumpModifierA + consistencyModifierA
    const scoreB = (deficitB * 10) + clumpModifierB + consistencyModifierB

    // Sort descending by score
    return scoreB - scoreA
  })
}
