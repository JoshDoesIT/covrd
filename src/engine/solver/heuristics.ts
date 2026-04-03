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

function countClusters(days: number[]): number {
  if (days.length === 0) return 0
  
  const sorted = [...new Set(days)].sort((a,b) => a - b)
  let clusters = 1
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i-1] > 1) {
      clusters++
    }
  }
  return clusters
}

function getClumpingModifier(assignedDays: number[], targetDay: number): number {
  if (assignedDays.length === 0) return 0

  // Hard penalty for double shifts on the same day
  if (assignedDays.includes(targetDay)) return -2000
  
  const currentClusters = countClusters(assignedDays)
  const proposedClusters = countClusters([...assignedDays, targetDay])
  
  if (proposedClusters < currentClusters) {
    // Bridged a gap! Perfect!
    return 1000
  }
  
  if (proposedClusters === currentClusters) {
    // Extending an existing block on the edge. Excellent!
    return 500
  }
  
  if (proposedClusters > currentClusters) {
    // Starting a brand new disjointed block. This causes fragmented "on-off-on" days!
    // Massive penalty so the solver only does this if literally no one else can extend a block.
    return -1000
  }
  
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
    // Clumping Modulator closes gaps and penalizes fragmented off-days.
    // Consistency Modulator rewards repeating schedules across different weeks.
    const scoreA = (deficitA * 10) + clumpModifierA + consistencyModifierA
    const scoreB = (deficitB * 10) + clumpModifierB + consistencyModifierB

    // Sort descending by score
    return scoreB - scoreA
  })
}
