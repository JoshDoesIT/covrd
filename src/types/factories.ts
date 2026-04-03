import type {
  Employee,
  CoverageRequirement,
  Shift,
  Schedule,
  Constraint,
  ConstraintType,
  RecurringTemplate,
  RecurrencePattern,
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
export function createCoverageRequirement(
  fields: Pick<CoverageRequirement, 'name' | 'day' | 'startTime' | 'endTime' | 'requiredStaff'> &
    Partial<Pick<CoverageRequirement, 'id'>>,
): CoverageRequirement {
  return {
    id: fields.id ?? generateId(),
    name: fields.name,
    day: fields.day,
    startTime: fields.startTime,
    endTime: fields.endTime,
    requiredStaff: fields.requiredStaff,
  }
}

/**
 * Create a new Shift.
 */
export function createShift(
  fields: Pick<Shift, 'day' | 'startTime' | 'endTime' | 'requiredStaff'> &
    Partial<Pick<Shift, 'id'>>,
): Shift {
  return {
    id: fields.id ?? generateId(),
    day: fields.day,
    startTime: fields.startTime,
    endTime: fields.endTime,
    requiredStaff: fields.requiredStaff,
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

/**
 * Create a new RecurringTemplate.
 */
export function createRecurringTemplate(
  fields: Pick<RecurringTemplate, 'name' | 'pattern'> & Partial<Omit<RecurringTemplate, 'name'>>,
): RecurringTemplate {
  const timestamp = now()

  return {
    id: fields.id ?? generateId(),
    name: fields.name,
    coverageRequirements: fields.coverageRequirements ?? [],
    constraints: fields.constraints ?? [],
    pattern: fields.pattern,
    createdAt: fields.createdAt ?? timestamp,
    updatedAt: fields.updatedAt ?? timestamp,
  }
}

// Re-export types for convenience
export type {
  Employee,
  CoverageRequirement,
  Shift,
  Schedule,
  Constraint,
  ConstraintType,
  RecurringTemplate,
  RecurrencePattern,
  DayOfWeek,
  EmploymentType,
  DayAvailability,
  TimeBlock,
  EmployeeRestriction,
  ShiftAssignment,
}
