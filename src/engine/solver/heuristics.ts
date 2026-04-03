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
  currentHours: Map<string, number>,
): Employee[] {
  return [...candidates].sort((a, b) => {
    const hoursA = currentHours.get(a.id) ?? 0
    const deficitA = a.targetHours - hoursA

    const hoursB = currentHours.get(b.id) ?? 0
    const deficitB = b.targetHours - hoursB

    // Sort descending by deficit (largest deficit comes first)
    return deficitB - deficitA
  })
}
