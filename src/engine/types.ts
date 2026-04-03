/**
 * Engine-Specific Types.
 *
 * The CSP solver utilizes a flattened, highly optimized version of the
 * domain models for rapid backtracking. Domain models map to these,
 * and after solving, these map back to 'ShiftAssignment' results.
 */

export interface EngineTimeBlock {
  start: string // 'HH:mm'
  end: string // 'HH:mm'
}

export interface EngineDayAvailability {
  dayOfWeek: number // 0-6 or 1-7 mapped from string
  isAvailable: boolean
  preferences: EngineTimeBlock[]
}

export interface EngineEmployee {
  id: string
  name: string
  role: string
  maxHours: number | null
  minHours: number | null
  targetHours: number
  isFullTime: boolean
  availability: EngineDayAvailability[]
  createdAt: number
  updatedAt: number
}

export interface EngineShift {
  id: string
  dayOfWeek: number
  start: string
  end: string
  role: string
  durationHours: number
  isAssigned: boolean
  employeeId?: string
}

export interface EngineCoverageRequirement {
  id: string
  dayOfWeek: number
  start: string
  end: string
  role: string
  headcount: number
}
