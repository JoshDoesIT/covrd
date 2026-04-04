import type {
  EngineCoverageRequirement as CoverageRequirement,
  EngineShift as Shift,
} from '../types'
import { calculateDuration } from '../core/time'

/**
 * Expands daily coverage requirements into individual concrete shifts
 * that the CSP solver can assign to specific employees.
 */
export function generateShiftsFromTemplate(requirements: CoverageRequirement[]): Shift[] {
  const shifts: Shift[] = []

  for (const req of requirements) {
    const duration = calculateDuration(req.start, req.end)

    for (let i = 0; i < req.headcount; i++) {
      shifts.push({
        id: `${req.id}-${i}`,
        dayOfWeek: req.dayOfWeek,
        weekNumber: 0,
        start: req.start,
        end: req.end,
        role: req.role,
        durationHours: duration,
        isAssigned: false,
      })
    }
  }

  return shifts
}
