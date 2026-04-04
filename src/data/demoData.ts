import type {
  Employee,
  CoverageRequirement,
  DayOfWeek,
  Shift,
  ShiftAssignment,
} from '../types/index'
import { generateScheduleAsync } from '../engine/worker/client'
import { createSchedule, createShift } from '../types/factories'
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

export const DEMO_COVERAGE_REQUIREMENTS: CoverageRequirement[] = (() => {
  const requirements: CoverageRequirement[] = []
  
  // Create 4 weeks of demo requirements
  for (let week = 0; week < 4; week++) {
    // April 6 is a Monday. 
    const baseDateMs = new Date('2026-04-06T00:00:00').getTime()
    const weekOffsetMs = week * 7 * 24 * 60 * 60 * 1000

    const days = [
      { d: 'monday', offset: 0 },
      { d: 'tuesday', offset: 1 },
      { d: 'wednesday', offset: 2 },
      { d: 'thursday', offset: 3 },
      { d: 'friday', offset: 4 },
      { d: 'saturday', offset: 5 },
      { d: 'sunday', offset: 6 }
    ]

    days.forEach(({ d, offset }) => {
      const dt = new Date(baseDateMs + weekOffsetMs + offset * 24 * 60 * 60 * 1000)
      const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
      
      const isWeekend = d === 'saturday' || d === 'sunday'

      if (!isWeekend) {
        requirements.push({
          id: `demo-cov-${d}-am-w${week}`,
          date: dateStr,
          startTime: '07:00',
          endTime: '16:00',
          unpaidBreakMinutes: 60,
          requiredStaff: 2,
        })
        requirements.push({
          id: `demo-cov-${d}-pm-w${week}`,
          date: dateStr,
          startTime: '13:00',
          endTime: '22:00',
          unpaidBreakMinutes: 60,
          // Reduced to 1 to ensure a perfect 100% demo schedule
          requiredStaff: 1, 
        })
      } else {
        requirements.push({
          id: `demo-cov-${d}-w${week}`,
          date: dateStr,
          startTime: d === 'saturday' ? '08:00' : '09:00',
          endTime: d === 'saturday' ? '17:00' : '18:00',
          unpaidBreakMinutes: 60,
          requiredStaff: 1,
        })
      }
    })
  }

  return requirements
})()

export async function loadDemoDataAsync() {
  const employees = DEMO_EMPLOYEES
  const coverageRequirements = DEMO_COVERAGE_REQUIREMENTS

  const totalWeeks = 4
  const baseDate = new Date('2026-04-06T00:00:00')
  const actualStartMonday = getNextMonday(baseDate)
  const baseMs = actualStartMonday.getTime()

  const generatedShifts: Shift[] = []

  coverageRequirements.forEach((r) => {
    const shiftDate = new Date(`${r.date}T00:00:00`)
    const dayDiff = Math.round((shiftDate.getTime() - baseMs) / (1000 * 60 * 60 * 24))
    const weekNumber = Math.floor(dayDiff / 7)

    if (weekNumber >= 0 && weekNumber < totalWeeks) {
      const dayOfWeek = dayDiff % 7
      const shift = createShift({
        day:
          (Object.keys(DAY_MAP).find(
            (k) => DAY_MAP[k as keyof typeof DAY_MAP] === dayOfWeek,
          ) as DayOfWeek) || 'monday',
        startTime: r.startTime,
        endTime: r.endTime,
        requiredStaff: r.requiredStaff,
        weekNumber,
        role: r.role,
        unpaidBreakMinutes: r.unpaidBreakMinutes,
      })
      generatedShifts.push(shift)
    }
  })

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

  return { employees, coverageRequirements, schedule }
}
