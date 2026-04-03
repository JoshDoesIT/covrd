import type {
  Employee,
  CoverageRequirement,
  Schedule,
  DayOfWeek,
  Shift,
  ShiftAssignment,
} from '../types/index'

/**
 * Demo Data — Pre-loaded example data for first-time users.
 *
 * Provides a realistic small-business scenario: a coffee shop
 * with 6 staff members, weekly coverage, and a generated schedule.
 * All IDs are deterministic for reproducibility.
 */

const DAYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

/** 6 demo employees with varied roles, types, and availability. */
export const DEMO_EMPLOYEES: Employee[] = [
  {
    id: 'demo-emp-1',
    name: 'Alex Rivera',
    role: 'Manager',
    employmentType: 'full-time',
    availability: DAYS.map((day) => ({
      day,
      blocks: day === 'sunday' ? [] : [{ startTime: '07:00', endTime: '17:00' }],
    })),
    maxHoursPerWeek: 40,
    minHoursPerWeek: 32,
    preferredShiftsPerWeek: 5,
    preferredTimes: [{ startTime: '07:00', endTime: '15:00' }],
    restrictions: [],
    color: '#6C5CE7',
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'demo-emp-2',
    name: 'Jordan Chen',
    role: 'Barista',
    employmentType: 'full-time',
    availability: DAYS.map((day) => ({
      day,
      blocks: ['saturday', 'sunday'].includes(day)
        ? []
        : [{ startTime: '06:00', endTime: '22:00' }],
    })),
    maxHoursPerWeek: 40,
    minHoursPerWeek: 30,
    preferredShiftsPerWeek: 5,
    preferredTimes: [{ startTime: '06:00', endTime: '14:00' }],
    restrictions: [],
    color: '#00B894',
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'demo-emp-3',
    name: 'Sam Patel',
    role: 'Barista',
    employmentType: 'full-time',
    availability: DAYS.map((day) => ({
      day,
      blocks: day === 'monday' ? [] : [{ startTime: '10:00', endTime: '22:00' }],
    })),
    maxHoursPerWeek: 40,
    minHoursPerWeek: 30,
    preferredShiftsPerWeek: 5,
    preferredTimes: [{ startTime: '14:00', endTime: '22:00' }],
    restrictions: [],
    color: '#E17055',
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'demo-emp-4',
    name: 'Casey Brooks',
    role: 'Barista',
    employmentType: 'part-time',
    availability: ['monday', 'wednesday', 'friday', 'saturday'].map((day) => ({
      day: day as DayOfWeek,
      blocks: [{ startTime: '08:00', endTime: '16:00' }],
    })),
    maxHoursPerWeek: 24,
    minHoursPerWeek: 12,
    preferredShiftsPerWeek: 3,
    preferredTimes: [{ startTime: '08:00', endTime: '14:00' }],
    restrictions: [],
    color: '#74B9FF',
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'demo-emp-5',
    name: 'Morgan Kim',
    role: 'Cashier',
    employmentType: 'part-time',
    availability: ['tuesday', 'thursday', 'saturday', 'sunday'].map((day) => ({
      day: day as DayOfWeek,
      blocks: [{ startTime: '10:00', endTime: '20:00' }],
    })),
    maxHoursPerWeek: 20,
    minHoursPerWeek: 8,
    preferredShiftsPerWeek: 3,
    preferredTimes: [{ startTime: '12:00', endTime: '18:00' }],
    restrictions: [],
    color: '#FDCB6E',
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'demo-emp-6',
    name: 'Taylor Nguyen',
    role: 'Closer',
    employmentType: 'part-time',
    availability: DAYS.filter((d) => d !== 'wednesday').map((day) => ({
      day,
      blocks: [{ startTime: '14:00', endTime: '22:00' }],
    })),
    maxHoursPerWeek: 24,
    minHoursPerWeek: 10,
    preferredShiftsPerWeek: 4,
    preferredTimes: [{ startTime: '16:00', endTime: '22:00' }],
    restrictions: [],
    color: '#A29BFE',
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
  },
]

/** Coverage requirements: morning + afternoon shifts for each weekday, single shift on weekends. */
export const DEMO_COVERAGE_REQUIREMENTS: CoverageRequirement[] = [
  // Weekdays — morning and afternoon
  ...(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as DayOfWeek[]).flatMap((day) => [
    {
      id: `demo-cov-${day}-am`,
      name: 'Day Shift',
      day,
      startTime: '07:00',
      endTime: '16:00',
      unpaidBreakMinutes: 60,
      requiredStaff: 2,
    },
    {
      id: `demo-cov-${day}-pm`,
      name: 'Evening Shift',
      day,
      startTime: '13:00',
      endTime: '22:00',
      unpaidBreakMinutes: 60,
      requiredStaff: 2,
    },
  ]),
  // Weekends — single longer shift
  {
    id: 'demo-cov-saturday',
    name: 'Weekend Shift',
    day: 'saturday',
    startTime: '08:00',
    endTime: '17:00',
    unpaidBreakMinutes: 60,
    requiredStaff: 2,
  },
  {
    id: 'demo-cov-sunday',
    name: 'Weekend Shift',
    day: 'sunday',
    startTime: '09:00',
    endTime: '18:00',
    unpaidBreakMinutes: 60,
    requiredStaff: 1,
  },
]

/** Build shifts from coverage requirements. */
const DEMO_SHIFTS: Shift[] = DEMO_COVERAGE_REQUIREMENTS.map((r) => ({
  id: `demo-shift-${r.id}`,
  day: r.day,
  startTime: r.startTime,
  endTime: r.endTime,
  requiredStaff: r.requiredStaff,
  unpaidBreakMinutes: r.unpaidBreakMinutes,
  weekNumber: 0,
}))

/** Pre-built assignments pairing employees to shifts. */
const DEMO_ASSIGNMENTS: ShiftAssignment[] = [
  // Monday AM: Alex + Jordan
  {
    id: 'demo-asgn-1',
    shiftId: 'demo-shift-demo-cov-monday-am',
    employeeId: 'demo-emp-1',
    isManual: false,
  },
  {
    id: 'demo-asgn-2',
    shiftId: 'demo-shift-demo-cov-monday-am',
    employeeId: 'demo-emp-2',
    isManual: false,
  },
  // Monday PM: Sam + Taylor
  {
    id: 'demo-asgn-3',
    shiftId: 'demo-shift-demo-cov-monday-pm',
    employeeId: 'demo-emp-3',
    isManual: false,
  },
  {
    id: 'demo-asgn-4',
    shiftId: 'demo-shift-demo-cov-monday-pm',
    employeeId: 'demo-emp-6',
    isManual: false,
  },
  // Tuesday AM: Alex + Casey
  {
    id: 'demo-asgn-5',
    shiftId: 'demo-shift-demo-cov-tuesday-am',
    employeeId: 'demo-emp-1',
    isManual: false,
  },
  {
    id: 'demo-asgn-6',
    shiftId: 'demo-shift-demo-cov-tuesday-am',
    employeeId: 'demo-emp-2',
    isManual: false,
  },
  // Tuesday PM: Sam + Morgan
  {
    id: 'demo-asgn-7',
    shiftId: 'demo-shift-demo-cov-tuesday-pm',
    employeeId: 'demo-emp-3',
    isManual: false,
  },
  {
    id: 'demo-asgn-8',
    shiftId: 'demo-shift-demo-cov-tuesday-pm',
    employeeId: 'demo-emp-5',
    isManual: false,
  },
  // Wednesday AM: Alex + Jordan
  {
    id: 'demo-asgn-9',
    shiftId: 'demo-shift-demo-cov-wednesday-am',
    employeeId: 'demo-emp-1',
    isManual: false,
  },
  {
    id: 'demo-asgn-10',
    shiftId: 'demo-shift-demo-cov-wednesday-am',
    employeeId: 'demo-emp-4',
    isManual: false,
  },
  // Wednesday PM: Sam + Alex
  {
    id: 'demo-asgn-11',
    shiftId: 'demo-shift-demo-cov-wednesday-pm',
    employeeId: 'demo-emp-3',
    isManual: false,
  },
  {
    id: 'demo-asgn-12',
    shiftId: 'demo-shift-demo-cov-wednesday-pm',
    employeeId: 'demo-emp-1',
    isManual: false,
  },
  // Thursday AM: Jordan + Casey
  {
    id: 'demo-asgn-13',
    shiftId: 'demo-shift-demo-cov-thursday-am',
    employeeId: 'demo-emp-2',
    isManual: false,
  },
  {
    id: 'demo-asgn-14',
    shiftId: 'demo-shift-demo-cov-thursday-am',
    employeeId: 'demo-emp-1',
    isManual: false,
  },
  // Thursday PM: Sam + Morgan
  {
    id: 'demo-asgn-15',
    shiftId: 'demo-shift-demo-cov-thursday-pm',
    employeeId: 'demo-emp-3',
    isManual: false,
  },
  {
    id: 'demo-asgn-16',
    shiftId: 'demo-shift-demo-cov-thursday-pm',
    employeeId: 'demo-emp-5',
    isManual: false,
  },
  // Friday AM: Alex + Jordan
  {
    id: 'demo-asgn-17',
    shiftId: 'demo-shift-demo-cov-friday-am',
    employeeId: 'demo-emp-1',
    isManual: false,
  },
  {
    id: 'demo-asgn-18',
    shiftId: 'demo-shift-demo-cov-friday-am',
    employeeId: 'demo-emp-4',
    isManual: false,
  },
  // Friday PM: Sam + Taylor
  {
    id: 'demo-asgn-19',
    shiftId: 'demo-shift-demo-cov-friday-pm',
    employeeId: 'demo-emp-3',
    isManual: false,
  },
  {
    id: 'demo-asgn-20',
    shiftId: 'demo-shift-demo-cov-friday-pm',
    employeeId: 'demo-emp-6',
    isManual: false,
  },
  // Saturday: Casey + Morgan
  {
    id: 'demo-asgn-21',
    shiftId: 'demo-shift-demo-cov-saturday',
    employeeId: 'demo-emp-4',
    isManual: false,
  },
  {
    id: 'demo-asgn-22',
    shiftId: 'demo-shift-demo-cov-saturday',
    employeeId: 'demo-emp-5',
    isManual: false,
  },
  // Sunday: Taylor
  {
    id: 'demo-asgn-23',
    shiftId: 'demo-shift-demo-cov-sunday',
    employeeId: 'demo-emp-6',
    isManual: false,
  },
]

/** Pre-built demo schedule. */
export const DEMO_SCHEDULE: Schedule = {
  id: 'demo-schedule-1',
  name: 'Demo — Week of April 6, 2026',
  startDate: '2026-04-06T00:00:00.000Z',
  endDate: '2026-04-12T23:59:59.000Z',
  shifts: DEMO_SHIFTS,
  assignments: DEMO_ASSIGNMENTS,
  qualityScore: 92,
  unfilledShiftIds: [],
  createdAt: '2026-04-06T09:00:00.000Z',
  updatedAt: '2026-04-06T09:00:00.000Z',
}

/**
 * Load all demo data in a single call.
 * Used by the onboarding wizard and "Load Demo" command.
 */
export function loadDemoData() {
  return {
    employees: DEMO_EMPLOYEES,
    coverageRequirements: DEMO_COVERAGE_REQUIREMENTS,
    schedule: DEMO_SCHEDULE,
  }
}
