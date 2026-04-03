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
  
  let minDistance = Infinity
  for (const d of assignedDays) {
    const dist = Math.abs(d - targetDay)
    if (dist < minDistance) minDistance = dist
  }
  
  if (minDistance === 0) return 300   // Same day (multiple shifts). Excellent!
  if (minDistance === 1) return 200   // Consecutive day. Great clumping!
  if (minDistance === 2) return -500  // 1-day gap (Working, Off, Working). TERRIBLE! Punish heavily.
  if (minDistance === 3) return -100  // 2-day gap. Sub-optimal but sometimes necessary.
  return 0 // 3+ day gap. Represents a solid block of off-days, entirely neutral/acceptable.
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

    const assignedDaysA = (assignments.get(a.id) ?? []).map(s => getAbsoluteDayIndex(s.weekNumber, s.dayOfWeek))
    const clumpModifierA = getClumpingModifier(assignedDaysA, targetDayIndex)

    const assignedDaysB = (assignments.get(b.id) ?? []).map(s => getAbsoluteDayIndex(s.weekNumber, s.dayOfWeek))
    const clumpModifierB = getClumpingModifier(assignedDaysB, targetDayIndex)

    // Deficit is primary metric (10pts per missing hour). Modulator adds enormous weight to close gaps 
    // and actively penalizes assignments that would create isolated fragmented off-days.
    const scoreA = (deficitA * 10) + clumpModifierA
    const scoreB = (deficitB * 10) + clumpModifierB

    // Sort descending by score
    return scoreB - scoreA
  })
}
