import { Employee, Shift } from '../../types'

/**
 * Calculates a 0-100 quality score for a generated schedule.
 * Heavily penalizes unfilled shifts. Mildly penalizes unfair hour distributions.
 */
export function calculateScheduleScore(
  employees: Employee[],
  assignedShifts: Shift[],
  unfilledShifts: Shift[],
): number {
  let score = 100

  // 1. Unfilled Shift Penalty (Massive penalty: -25 points per unfilled shift)
  score -= unfilledShifts.length * 25

  // 2. Fairness Penalty (Standard Deviation of Target Deficits)
  const totals = new Map<string, number>()
  for (const shift of assignedShifts) {
    if (shift.employeeId) {
      const cur = totals.get(shift.employeeId) ?? 0
      totals.set(shift.employeeId, cur + shift.durationHours)
    }
  }

  let totalDeficit = 0
  const deficits: number[] = []

  for (const emp of employees) {
    const hoursScheduled = totals.get(emp.id) ?? 0
    // Raw deficit (positive = over scheduled, negative = under scheduled)
    const deficit = hoursScheduled - emp.targetHours
    deficits.push(deficit)
    totalDeficit += deficit
  }

  if (employees.length > 0) {
    const meanDeficit = totalDeficit / employees.length

    let varianceSum = 0
    for (const d of deficits) {
      varianceSum += Math.pow(d - meanDeficit, 2)
    }

    // Calculate standard deviation of the variance from target
    const stdDev = Math.sqrt(varianceSum / employees.length)

    // Penalize score by 5 points per 1 hour of standard deviation
    score -= stdDev * 5
  }

  // Bound between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)))
}
