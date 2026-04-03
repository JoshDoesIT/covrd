import { useMemo } from 'react'
import { useScheduleStore } from '../../stores/scheduleStore'
import { useCoverageStore } from '../../stores/coverageStore'
import type { Schedule, Shift, ShiftAssignment, CoverageRequirement, DayOfWeek } from '../../types/index'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
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
  coverageReqs: CoverageRequirement[],
  activeWeekNumber: number
): DayCoverage[] {
  if (!schedule) return []

  // Count assignments per day
  const shiftsByDay = new Map<DayOfWeek, number>()
  
  const weeklyShifts = schedule.shifts.filter((s: Shift) => (s.weekNumber || 0) === activeWeekNumber)
  
  weeklyShifts.forEach((s: Shift) => {
    const assignedCount = schedule.assignments.filter(
      (a: ShiftAssignment) => a.shiftId === s.id,
    ).length
    shiftsByDay.set(s.day, (shiftsByDay.get(s.day) ?? 0) + assignedCount)
  })

  // Sum required staff per day from coverage requirements
  const requiredByDay = new Map<DayOfWeek, number>()
  coverageReqs.forEach((req) => {
    requiredByDay.set(req.day, (requiredByDay.get(req.day) ?? 0) + req.requiredStaff)
  })

  return DAY_ORDER.map((day) => {
    const required = requiredByDay.get(day) ?? 0
    const assigned = shiftsByDay.get(day) ?? 0
    const fillRate = required > 0 ? Math.round((assigned / required) * 100) : assigned > 0 ? 100 : 0
    return { name: DAY_SHORT[day], required, assigned, fillRate }
  })
}

function getCoverageColor(fillRate: number): string {
  if (fillRate >= 100) return '#0ea5e9' // Fully covered (cyan pop)
  if (fillRate >= 75) return '#f59e0b'  // Mostly covered
  return '#ef4444'                       // Under-covered
}

/**
 * CoverageHeatmap — Shows per-day staffing fill rate.
 *
 * Stacked bars show assigned (colored by fill rate) vs required staff.
 * A summary row shows the overall coverage score.
 */
export function CoverageHeatmap({ activeWeekNumber }: { activeWeekNumber: number }) {
  const { activeSchedule } = useScheduleStore()
  const { requirements } = useCoverageStore()

  const data = useMemo(
    () => computeCoverage(activeSchedule, requirements, activeWeekNumber),
    [activeSchedule, requirements, activeWeekNumber],
  )

  const overallFillRate = useMemo(() => {
    const totalRequired = data.reduce((s, d) => s + d.required, 0)
    const totalAssigned = data.reduce((s, d) => s + d.assigned, 0)
    if (totalRequired === 0) return totalAssigned > 0 ? 100 : 0
    return Math.round((totalAssigned / totalRequired) * 100)
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

      <div style={{ width: '100%', flex: 1, minHeight: 280 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} />
            <YAxis stroke="var(--color-text-muted)" fontSize={12} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '0.8rem',
              }}
              itemStyle={{ color: 'var(--color-text-primary)' }}
            />
            <Bar dataKey="required" fill="var(--color-text-muted)" opacity={0.2} radius={[4, 4, 0, 0]} name="Required" />
            <Bar dataKey="assigned" radius={[4, 4, 0, 0]} name="Assigned">
              {data.map((entry, index) => (
                <Cell key={index} fill={getCoverageColor(entry.fillRate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Day-by-day quick stats */}
      <div className="heatmap-day-pills">
        {data.map((d) => (
          <div
            key={d.name}
            className="heatmap-pill"
            style={{ borderColor: getCoverageColor(d.fillRate) }}
          >
            <span className="pill-day">{d.name}</span>
            <span className="pill-ratio" style={{ color: getCoverageColor(d.fillRate) }}>
              {d.assigned}/{d.required}
            </span>
          </div>
        ))}
      </div>

      <div className="coverage-legend" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0ea5e9' }} /> 100%+ Coverage
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /> 75%+ Coverage
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} /> &lt;75% Coverage
        </span>
      </div>
    </div>
  )
}
