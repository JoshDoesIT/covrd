export type OverrideHistory = {
  employeeId: string
  removedFromDay: number | null
  addedToDay: number | null
}

/**
 * Reviews historical manual schedule edits.
 * If a manager consistently removes Alice from Monday shifts,
 * the solver gives Alice a negative weight for future Mondays, reducing
 * the chance she is assigned a Monday shift via the MRV/LCV heuristic scoring.
 */
export function calculateCandidateWeights(
  candidateIds: string[],
  targetDayOfWeek: number,
  historicalOverrides: OverrideHistory[],
): Map<string, number> {
  const weights = new Map<string, number>()

  // Initialize weights to 0
  for (const cid of candidateIds) {
    weights.set(cid, 0)
  }

  for (const hist of historicalOverrides) {
    // If the candidate was removed from this target day, they get a negative penalty
    if (hist.removedFromDay === targetDayOfWeek && weights.has(hist.employeeId)) {
      const current = weights.get(hist.employeeId)!
      weights.set(hist.employeeId, current - 1)
    }

    // If the candidate was manually added by a manager to this target day, they get a bonus
    if (hist.addedToDay === targetDayOfWeek && weights.has(hist.employeeId)) {
      const current = weights.get(hist.employeeId)!
      weights.set(hist.employeeId, current + 1)
    }
  }

  return weights
}
