import type {
  Employee,
  CoverageRequirement,
  BaselineRequirement,
  Shift,
  Schedule,
  Constraint,
  ConstraintType,
  DayOfWeek,
  EmploymentType,
  DayAvailability,
  TimeBlock,
  EmployeeRestriction,
  ShiftAssignment,
} from './index'

/**
 * Generate a unique ID using crypto.randomUUID.
 */
function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Get the current ISO timestamp.
 */
function now(): string {
  return new Date().toISOString()
}

/** Auto-assigned colors for employees (distinguishable on dark backgrounds). */
const EMPLOYEE_COLORS = [
  '#6C5CE7',
  '#00B894',
  '#E17055',
  '#74B9FF',
  '#FDCB6E',
  '#A29BFE',
  '#55EFC4',
  '#FAB1A0',
  '#81ECEC',
  '#FF7675',
  '#FD79A8',
  '#00CEC9',
] as const

let colorIndex = 0

/**
 * Create a new Employee with sensible defaults.
 */
export function createEmployee(
  fields: Pick<Employee, 'name' | 'role'> & Partial<Omit<Employee, 'name' | 'role'>>,
): Employee {
  const color = fields.color ?? EMPLOYEE_COLORS[colorIndex++ % EMPLOYEE_COLORS.length]
  const timestamp = now()

  return {
    id: fields.id ?? generateId(),
    name: fields.name,
    role: fields.role,
    employmentType: fields.employmentType ?? 'full-time',
    availability: fields.availability ?? [],
    maxHoursPerWeek: fields.maxHoursPerWeek ?? 40,
    minHoursPerWeek: fields.minHoursPerWeek ?? 0,
    preferredShiftsPerWeek: fields.preferredShiftsPerWeek ?? null,
    preferredTimes: fields.preferredTimes ?? [],
    restrictions: fields.restrictions ?? [],
    color,
    createdAt: fields.createdAt ?? timestamp,
    updatedAt: fields.updatedAt ?? timestamp,
  }
}

/**
 * Create a new CoverageRequirement.
 */
export function createCoverageRequirement(props: {
  id?: string
  date: string
  startTime: string
  endTime: string
  requiredStaff: number
  role?: string
  unpaidBreakMinutes?: number
}) {
  return {
    id: props.id ?? generateId(),
    date: props.date,
    startTime: props.startTime,
    endTime: props.endTime,
    requiredStaff: props.requiredStaff,
    role: props.role,
    unpaidBreakMinutes: props.unpaidBreakMinutes,
  }
}

/**
 * Create a new BaselineRequirement.
 */
export function createBaselineRequirement(props: {
  id?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  requiredStaff: number
  role?: string
  unpaidBreakMinutes?: number
}) {
  return {
    id: props.id ?? generateId(),
    dayOfWeek: props.dayOfWeek,
    startTime: props.startTime,
    endTime: props.endTime,
    requiredStaff: props.requiredStaff,
    role: props.role,
    unpaidBreakMinutes: props.unpaidBreakMinutes,
  }
}

/**
 * Create a new Shift.
 */
export function createShift(props: {
  id?: string
  day: DayOfWeek
  startTime: string
  endTime: string
  requiredStaff: number
  role?: string
  unpaidBreakMinutes?: number
  weekNumber?: number
}) {
  return {
    id: props.id ?? generateId(),
    day: props.day,
    startTime: props.startTime,
    endTime: props.endTime,
    requiredStaff: props.requiredStaff,
    role: props.role,
    unpaidBreakMinutes: props.unpaidBreakMinutes,
    weekNumber: props.weekNumber,
  }
}

/**
 * Create a new Schedule with empty assignments.
 */
export function createSchedule(
  fields: Pick<Schedule, 'name' | 'startDate' | 'endDate'> & Partial<Omit<Schedule, 'name'>>,
): Schedule {
  const timestamp = now()

  return {
    id: fields.id ?? generateId(),
    name: fields.name,
    startDate: fields.startDate,
    endDate: fields.endDate,
    shifts: fields.shifts ?? [],
    assignments: fields.assignments ?? [],
    qualityScore: fields.qualityScore ?? null,
    unfilledShiftIds: fields.unfilledShiftIds ?? [],
    createdAt: fields.createdAt ?? timestamp,
    updatedAt: fields.updatedAt ?? timestamp,
  }
}

/**
 * Create a new Constraint.
 */
export function createConstraint(
  fields: Pick<Constraint, 'name' | 'type' | 'rule'> & Partial<Pick<Constraint, 'id' | 'enabled'>>,
): Constraint {
  return {
    id: fields.id ?? generateId(),
    name: fields.name,
    type: fields.type,
    enabled: fields.enabled ?? true,
    rule: fields.rule,
  }
}

// Re-export types for convenience
export type {
  Employee,
  CoverageRequirement,
  BaselineRequirement,
  Shift,
  Schedule,
  ConstraintType,
  DayOfWeek,
  EmploymentType,
  DayAvailability,
  TimeBlock,
  EmployeeRestriction,
  ShiftAssignment,
}
