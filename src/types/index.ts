/**
 * Covrd — Core Data Types
 *
 * All types for the scheduling domain model.
 * These are pure TypeScript types with no runtime behavior.
 */

/** Unique identifier for entities. */
export type EntityId = string

/** Days of the week. */
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

/** All days of the week, ordered. */
export const DAYS_OF_WEEK: readonly DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

/**
 * A block of time within a single day.
 * Times are in 24-hour "HH:mm" format.
 */
export interface TimeBlock {
  /** Start time in "HH:mm" format (e.g., "09:00"). */
  startTime: string
  /** End time in "HH:mm" format (e.g., "17:00"). */
  endTime: string
}

/**
 * Employee availability for a specific day.
 */
export interface DayAvailability {
  day: DayOfWeek
  /** Time blocks the employee is available. Empty = unavailable all day. */
  blocks: TimeBlock[]
}

/** Employment classification. */
export type EmploymentType = 'full-time' | 'part-time'

/**
 * A restriction on when an employee can or cannot work.
 */
export interface EmployeeRestriction {
  id: EntityId
  /** Human-readable description (e.g., "Cannot work mornings"). */
  description: string
  /** The type of restriction. */
  type: 'cannot-work-days' | 'cannot-work-times' | 'only-work-days' | 'only-work-times' | 'custom'
  /** Days this restriction applies to (for day-based restrictions). */
  days?: DayOfWeek[]
  /** Time range this restriction applies to (for time-based restrictions). */
  timeRange?: TimeBlock
}

/**
 * An employee who can be scheduled for shifts.
 */
export interface Employee {
  id: EntityId
  name: string
  role: string
  employmentType: EmploymentType
  /** Weekly availability per day. */
  availability: DayAvailability[]
  /** Maximum weekly hours. */
  maxHoursPerWeek: number
  /** Minimum weekly hours (0 = no minimum). */
  minHoursPerWeek: number
  /** Preferred number of shifts per week (soft constraint). */
  preferredShiftsPerWeek: number | null
  /** Preferred shift times (soft constraint). */
  preferredTimes: TimeBlock[]
  /** Hard restrictions on scheduling. */
  restrictions: EmployeeRestriction[]
  /** Color for display (auto-assigned or custom). */
  color: string
  /** When this employee was created. */
  createdAt: string
  /** When this employee was last updated. */
  updatedAt: string
}

/**
 * A single shift slot that needs to be filled.
 */
export interface Shift {
  id: EntityId
  day: DayOfWeek
  startTime: string
  endTime: string
  /** Number of employees needed for this shift. */
  requiredStaff: number
  /** Specific role required for this shift. */
  role?: string
  /** Week offset from the start date (0 = first week). Required for multi-week. */
  weekNumber?: number
}

/**
 * Coverage requirements: how many staff are needed per time block per day.
 */
export interface CoverageRequirement {
  id: EntityId
  /** Human-readable name (e.g., "Morning Rush"). */
  name: string
  day: DayOfWeek
  startTime: string
  endTime: string
  /** Minimum staff required during this block. */
  requiredStaff: number
  /** Specific role required for this block. */
  role?: string
}

/**
 * A schedule assignment: one employee assigned to one shift.
 */
export interface ShiftAssignment {
  id: EntityId
  shiftId: EntityId
  employeeId: EntityId
  /** Whether this was manually assigned (vs auto-generated). */
  isManual: boolean
}

/** Constraint severity. */
export type ConstraintType = 'hard' | 'soft'

/**
 * A scheduling constraint (rule).
 */
export interface Constraint {
  id: EntityId
  name: string
  type: ConstraintType
  /** Whether this constraint is currently active. */
  enabled: boolean
  /** The rule definition (varies by constraint kind). */
  rule:
    | { kind: 'max-hours'; maxHours: number }
    | { kind: 'min-hours'; minHours: number }
    | { kind: 'max-consecutive-days'; maxDays: number }
    | { kind: 'required-gap-hours'; gapHours: number }
    | { kind: 'custom'; description: string }
}

/**
 * A complete generated schedule.
 */
export interface Schedule {
  id: EntityId
  /** Human-readable name (e.g., "Week of Apr 7, 2026"). */
  name: string
  /** ISO date string for the start of the schedule period. */
  startDate: string
  /** ISO date string for the end of the schedule period. */
  endDate: string
  /** All shift definitions for this schedule. */
  shifts: Shift[]
  /** All assignments mapping employees to shifts. */
  assignments: ShiftAssignment[]
  /** Quality score from 0-100, calculated by the solver. */
  qualityScore: number | null
  /** Shifts that could not be filled. */
  unfilledShiftIds: EntityId[]
  /** When this schedule was generated. */
  createdAt: string
  /** When this schedule was last modified. */
  updatedAt: string
}

/** Recurring pattern type. */
export type RecurrencePattern =
  | { kind: 'weekly' }
  | { kind: 'biweekly'; weekA: string; weekB: string }
  | { kind: 'rotation'; weeks: string[]; cycleLength: number }
  | { kind: 'monthly'; weekOfMonth: number }

/**
 * A reusable schedule template with coverage requirements and rules.
 */
export interface RecurringTemplate {
  id: EntityId
  /** Template name (e.g., "Summer Schedule"). */
  name: string
  /** Coverage requirements for this template. */
  coverageRequirements: CoverageRequirement[]
  /** Constraints for this template. */
  constraints: Constraint[]
  /** Recurrence pattern. */
  pattern: RecurrencePattern
  /** When this template was created. */
  createdAt: string
  /** When this template was last updated. */
  updatedAt: string
}

/**
 * Application-level settings stored in localStorage.
 */
export interface AppSettings {
  /** Current theme. */
  theme: 'dark' | 'light'
  /** Whether the sidebar is collapsed. */
  sidebarCollapsed: boolean
  /** Default view for the schedule. */
  defaultView: 'grid' | 'timeline'
  /** Time display format. */
  timeFormat: '12h' | '24h'
}
