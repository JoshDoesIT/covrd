import type {
  Employee,
  CoverageRequirement,
  DayOfWeek,
  Shift,
  ShiftAssignment,
} from '../types/index'
import { generateScheduleAsync } from '../engine/worker/client'
import { createSchedule, createShift, createBaselineRequirement } from '../types/factories'
import { getNextMonday } from '../utils/scheduleDates'
import type { EngineEmployee, EngineShift } from '../engine/types'

const DAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

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
      // Alex can work any time, but takes Sundays off.
      blocks: day === 'sunday' ? [] : [{ startTime: '06:00', endTime: '18:00' }],
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
      // Jordan can work any time, but takes weekends off.
      blocks: ['saturday', 'sunday'].includes(day)
        ? []
        : [{ startTime: '06:00', endTime: '23:00' }],
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
      // Sam can work PM and weekends
      blocks: day === 'monday' ? [] : [{ startTime: '08:00', endTime: '23:00' }],
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
      // Casey works mornings and weekends
      blocks: [{ startTime: '06:00', endTime: '18:00' }],
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
      // Morgan works anytime on their days
      blocks: [{ startTime: '06:00', endTime: '22:00' }],
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
      // Taylor works PM and weekends
      blocks: [{ startTime: '12:00', endTime: '23:00' }],
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

export const DEMO_COVERAGE_REQUIREMENTS: CoverageRequirement[] = []

export const DEMO_BASELINE_REQUIREMENTS: import('../types/index').BaselineRequirement[] = (() => {
  const baselines: import('../types/index').BaselineRequirement[] = []

  const days = [
    { d: 'monday', dow: 0 },
    { d: 'tuesday', dow: 1 },
    { d: 'wednesday', dow: 2 },
    { d: 'thursday', dow: 3 },
    { d: 'friday', dow: 4 },
    { d: 'saturday', dow: 5 },
    { d: 'sunday', dow: 6 },
  ]

  days.forEach(({ d, dow }) => {
    const isWeekend = d === 'saturday' || d === 'sunday'

    if (!isWeekend) {
      baselines.push(
        createBaselineRequirement({
          id: `demo-base-${d}-am`,
          dayOfWeek: dow,
          startTime: '07:00',
          endTime: '16:00',
          unpaidBreakMinutes: 60,
          requiredStaff: 2,
        }),
      )
      baselines.push(
        createBaselineRequirement({
          id: `demo-base-${d}-pm`,
          dayOfWeek: dow,
          startTime: '13:00',
          endTime: '22:00',
          unpaidBreakMinutes: 60,
          requiredStaff: 1,
        }),
      )
    } else {
      baselines.push(
        createBaselineRequirement({
          id: `demo-base-${d}`,
          dayOfWeek: dow,
          startTime: d === 'saturday' ? '08:00' : '09:00',
          endTime: d === 'saturday' ? '17:00' : '18:00',
          unpaidBreakMinutes: 60,
          requiredStaff: 1,
        }),
      )
    }
  })

  return baselines
})()

export async function loadDemoDataAsync() {
  const employees = DEMO_EMPLOYEES
  const coverageRequirements = DEMO_COVERAGE_REQUIREMENTS
  const baselineRequirements = DEMO_BASELINE_REQUIREMENTS

  const totalWeeks = 4
  const baseDate = new Date('2026-04-06T00:00:00')
  const actualStartMonday = getNextMonday(baseDate)
  const baseMs = actualStartMonday.getTime()

  const generatedShifts: Shift[] = []

  // Generate mock runtime CoverageRequirements by iterating days
  for (let weekNumber = 0; weekNumber < totalWeeks; weekNumber++) {
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const dt = new Date(baseMs + (weekNumber * 7 + dayOffset) * 24 * 60 * 60 * 1000)
      const rawDay = dt.getDay()
      const dayOfWeekNum = rawDay === 0 ? 6 : rawDay - 1

      const reqs = baselineRequirements.filter((r) => r.dayOfWeek === dayOfWeekNum)

      reqs.forEach((r) => {
        const shift = createShift({
          day:
            (Object.keys(DAY_MAP).find((k) => DAY_MAP[k] === dayOfWeekNum) as DayOfWeek) ||
            'monday',
          startTime: r.startTime,
          endTime: r.endTime,
          requiredStaff: r.requiredStaff,
          weekNumber,
          role: r.role,
          unpaidBreakMinutes: r.unpaidBreakMinutes,
        })
        generatedShifts.push(shift)
      })
    }
  }

  // MAP TO ENGINE DTOs
  const engineEmployees: EngineEmployee[] = employees.map((e) => ({
    id: e.id,
    name: e.name,
    role: e.role,
    maxHours: e.maxHoursPerWeek,
    minHours: e.minHoursPerWeek,
    targetHours: e.maxHoursPerWeek, // Simplified
    isFullTime: e.employmentType === 'full-time',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    availability: e.availability.map((a) => ({
      dayOfWeek: DAY_MAP[a.day] ?? 0,
      isAvailable: a.blocks.length > 0,
      preferences: a.blocks.map((b) => ({ start: b.startTime, end: b.endTime })),
    })),
  }))

  const engineShifts: EngineShift[] = []
  generatedShifts.forEach((s) => {
    const startH = parseInt(s.startTime.split(':')[0], 10)
    const endH = parseInt(s.endTime.split(':')[0], 10)
    let duration = endH > startH ? endH - startH : 24 - startH + endH

    if (s.unpaidBreakMinutes) {
      duration -= s.unpaidBreakMinutes / 60
    }

    for (let i = 0; i < s.requiredStaff; i++) {
      engineShifts.push({
        id: `${s.id}-${i}`,
        dayOfWeek: DAY_MAP[s.day] ?? 0,
        weekNumber: s.weekNumber ?? 0,
        start: s.startTime,
        end: s.endTime,
        role: s.role || 'any',
        durationHours: duration,
        isAssigned: false,
      })
    }
  })

  const result = await generateScheduleAsync(engineEmployees, engineShifts, () => {})

  const finalAssignments: ShiftAssignment[] = result.assignedShifts
    .filter((s) => s.employeeId)
    .map((a) => ({
      id: crypto.randomUUID(),
      shiftId: a.id.substring(0, a.id.lastIndexOf('-')),
      employeeId: a.employeeId!,
      isManual: false,
    }))

  const schedule = createSchedule({
    name: 'Standard Schedule',
    startDate: actualStartMonday.toISOString(),
    endDate: new Date(
      actualStartMonday.getTime() + totalWeeks * 7 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    shifts: generatedShifts,
    assignments: finalAssignments,
    qualityScore: result.success ? 100 : 0,
    unfilledShiftIds: result.unfilledShifts.map((s) => s.id),
  })

  return { employees, coverageRequirements, baselineRequirements, schedule }
}
