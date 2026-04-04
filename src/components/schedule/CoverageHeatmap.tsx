import { useMemo } from 'react'
import { useScheduleStore } from '../../stores/scheduleStore'
import { useCoverageStore } from '../../stores/coverageStore'
import type {
  Schedule,
  Shift,
  ShiftAssignment,
  CoverageRequirement,
  DayOfWeek,
} from '../../types/index'
import { getShiftDate } from '../../utils/scheduleDates'
import './CoverageHeatmap.css'

const DAY_SHORT: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

const DAY_ORDER: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

interface DayCoverage {
  name: string
  required: number
  assigned: number
  fillRate: number
}

/**
 * Compute per-day coverage: how many staff are required vs how many are
 * actually assigned in the active schedule.
 */
function computeCoverage(
  schedule: Schedule | null,
  getRequirementsForDate: (date: string) => CoverageRequirement[],
  activeWeekNumber: number,
): DayCoverage[] {
  if (!schedule) return []

  // Count assignments per day
  const shiftsByDay = new Map<DayOfWeek, number>()

  const weeklyShifts = schedule.shifts.filter(
    (s: Shift) => (s.weekNumber || 0) === activeWeekNumber,
  )

  weeklyShifts.forEach((s: Shift) => {
    const assignedCount = schedule.assignments.filter(
      (a: ShiftAssignment) => a.shiftId === s.id,
    ).length
    shiftsByDay.set(s.day, (shiftsByDay.get(s.day) ?? 0) + assignedCount)
  })

  // Sum required staff per day using the resolver (supports both baseline templates and calendar exceptions)
  const requiredByDay = new Map<DayOfWeek, number>()

  DAY_ORDER.forEach((day) => {
    const dateObj = getShiftDate(schedule.startDate, activeWeekNumber, day)
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
    const reqs = getRequirementsForDate(dateStr)
    const total = reqs.reduce((sum, r) => sum + r.requiredStaff, 0)
    requiredByDay.set(day, total)
  })

  return DAY_ORDER.map((day) => {
    const required = requiredByDay.get(day) ?? 0
    const assigned = shiftsByDay.get(day) ?? 0
    const fillRate = required > 0 ? Math.round((assigned / required) * 100) : assigned > 0 ? 100 : 0
    return { name: DAY_SHORT[day], required, assigned, fillRate }
  })
}

function getCoverageColor(fillRate: number): string {
  if (fillRate >= 100) return '#00b894' // Fully covered (green match)
  if (fillRate >= 75) return '#f59e0b' // Mostly covered
  return '#ef4444' // Under-covered
}

/**
 * CoverageHeatmap — Shows per-day staffing fill rate.
 *
 * Stacked bars show assigned (colored by fill rate) vs required staff.
 * A summary row shows the overall coverage score.
 */
export function CoverageHeatmap({ activeWeekNumber }: { activeWeekNumber: number }) {
  const { activeSchedule } = useScheduleStore()
  const { getRequirementsForDate } = useCoverageStore()

  const data = useMemo(
    () => computeCoverage(activeSchedule, getRequirementsForDate, activeWeekNumber),
    [activeSchedule, getRequirementsForDate, activeWeekNumber],
  )

  const overallFillRate = useMemo(() => {
    const totalRequired = data.reduce((s, d) => s + d.required, 0)
    // By capping the effective assignment count to the required count per day,
    // we prevent over-drafting on one day from falsely padding the week's overall fill rate.
    const effectiveAssigned = data.reduce((s, d) => s + Math.min(d.assigned, d.required), 0)

    if (totalRequired === 0) return effectiveAssigned > 0 ? 100 : 0
    return Math.round((effectiveAssigned / totalRequired) * 100)
  }, [data])

  if (!activeSchedule) {
    return (
      <div className="coverage-heatmap empty-state">
        <p>No active schedule to analyze.</p>
        <span className="sr-only">Coverage Analytics</span>
      </div>
    )
  }

  return (
    <div className="coverage-heatmap">
      <div className="heatmap-header">
        <h3 className="heatmap-title">Coverage Analytics</h3>
        <div className="heatmap-score">
          <span className="heatmap-score-label">Fill Rate</span>
          <span
            className="heatmap-score-value"
            style={{ color: getCoverageColor(overallFillRate) }}
          >
            {overallFillRate}%
          </span>
        </div>
      </div>

      <div
        className="heatmap-day-pills"
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.75rem',
          padding: '1rem 0',
          alignItems: 'stretch',
        }}
      >
        {data.map((d) => (
          <div
            key={d.name}
            className="heatmap-pill"
            style={{
              borderColor: getCoverageColor(d.fillRate),
              borderWidth: '2px',
              backgroundColor: `${getCoverageColor(d.fillRate)}15`,
              justifyContent: 'center',
              borderRadius: '12px',
            }}
          >
            <span className="pill-day" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              {d.name.substring(0, 3)}
            </span>
            <span
              className="pill-ratio"
              style={{ color: getCoverageColor(d.fillRate), fontSize: '1.25rem' }}
            >
              {d.assigned}/{d.required}
            </span>
            <span
              style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}
            >
              {d.fillRate}%
            </span>
          </div>
        ))}
      </div>

      <div
        className="coverage-legend"
        style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00b894' }} /> Fully
          covered
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />{' '}
          Mostly covered
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />{' '}
          Under-covered
        </span>
      </div>
    </div>
  )
}
