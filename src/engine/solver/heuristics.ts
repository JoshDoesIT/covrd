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
export function sortCandidatesByFairness(
  candidates: Employee[],
  hourTotals: Map<string, Map<number, number>>,
  shiftToAssign: Shift,
  assignments: Map<string, Shift[]>
): Employee[] {
  return [...candidates].sort((a, b) => {
    const empWeekMapA = hourTotals.get(a.id) ?? new Map<number, number>()
    const hoursA = empWeekMapA.get(shiftToAssign.weekNumber) ?? 0
    const deficitA = a.targetHours - hoursA

    const empWeekMapB = hourTotals.get(b.id) ?? new Map<number, number>()
    const hoursB = empWeekMapB.get(shiftToAssign.weekNumber) ?? 0
    const deficitB = b.targetHours - hoursB

    // Consecutive Shift Bonus (Group Off-Days)
    // Checks if candidate is already working yesterday or tomorrow natively cross-week
    const hasConsecutiveA = (assignments.get(a.id) ?? []).some(s => 
      (s.weekNumber === shiftToAssign.weekNumber && Math.abs(s.dayOfWeek - shiftToAssign.dayOfWeek) === 1) ||
      (s.weekNumber === shiftToAssign.weekNumber - 1 && shiftToAssign.dayOfWeek === 0 && s.dayOfWeek === 6) ||
      (s.weekNumber === shiftToAssign.weekNumber + 1 && shiftToAssign.dayOfWeek === 6 && s.dayOfWeek === 0)
    )
    
    const hasConsecutiveB = (assignments.get(b.id) ?? []).some(s => 
      (s.weekNumber === shiftToAssign.weekNumber && Math.abs(s.dayOfWeek - shiftToAssign.dayOfWeek) === 1) ||
      (s.weekNumber === shiftToAssign.weekNumber - 1 && shiftToAssign.dayOfWeek === 0 && s.dayOfWeek === 6) ||
      (s.weekNumber === shiftToAssign.weekNumber + 1 && shiftToAssign.dayOfWeek === 6 && s.dayOfWeek === 0)
    )

    // Deficit is primary metric (10pts per missing hour). Modulator adds massive 200pt (+20hr equivalent) weight 
    // to candidates continuing a streak, drastically clumping workdays together which clumps off-days.
    const scoreA = (deficitA * 10) + (hasConsecutiveA ? 200 : 0)
    const scoreB = (deficitB * 10) + (hasConsecutiveB ? 200 : 0)

    // Sort descending by score
    return scoreB - scoreA
  })
}
