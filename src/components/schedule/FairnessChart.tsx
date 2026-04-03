import { useMemo } from 'react'
import { useScheduleStore } from '../../stores/scheduleStore'
import { useEmployeeStore } from '../../stores/employeeStore'
import type { Employee, Schedule, Shift, ShiftAssignment } from '../../types/index'
import './FairnessChart.css'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'

/**
 * Compute fairness data from the active schedule.
 * Returns per-employee utilization % and an overall fairness score (0-100).
 *
 * Fairness is measured by how evenly hours are distributed relative to each
 * employee's max capacity. A perfectly fair schedule gives every employee
 * the same utilization ratio. The score is derived from the coefficient of
 * variation (CV) of utilization: score = max(0, 100 - CV * 100).
 */
function computeFairnessData(
  activeSchedule: Schedule | null,
  employees: Employee[],
  activeWeekNumber: number,
) {
  if (!activeSchedule || activeSchedule.assignments.length === 0 || employees.length === 0) {
    return { chartData: [], fairnessScore: 0, avgUtilization: 0 }
  }

  // Map shifts by ID for quick hour lookup
  const shiftHours = new Map<string, number>()
  activeSchedule.shifts.forEach((s: Shift) => {
    const sh = parseInt(s.startTime.split(':')[0], 10)
    const eh = parseInt(s.endTime.split(':')[0], 10)
    let duration = eh > sh ? eh - sh : 24 - sh + eh
    if (s.unpaidBreakMinutes) {
      duration -= (s.unpaidBreakMinutes / 60)
    }
    shiftHours.set(s.id, duration)
  })

  // Accumulate hours per employee for the active week only
  const hoursMap = new Map<string, number>()
  activeSchedule.assignments.forEach((a: ShiftAssignment) => {
    const shift = activeSchedule.shifts.find(s => s.id === a.shiftId)
    // Ignore assignments for shifts not in the active week
    if (!shift || (shift.weekNumber || 0) !== activeWeekNumber) return

    const current = hoursMap.get(a.employeeId) ?? 0
    const dur = shiftHours.get(a.shiftId) ?? 0
    hoursMap.set(a.employeeId, current + dur)
  })

  // Calculate utilization % for each employee
  const chartData = employees.map((emp: Employee) => {
    const hours = hoursMap.get(emp.id) ?? 0
    const max = emp.maxHoursPerWeek || 40
    const utilization = Math.round((hours / max) * 100)
    return {
      name: emp.name.split(' ')[0],
      hours,
      max,
      utilization: Math.min(utilization, 150), // Cap at 150% for display
      shifts: activeSchedule.assignments.filter((a: ShiftAssignment) => a.employeeId === emp.id).length,
    }
  })

  // Compute fairness score from coefficient of variation of utilization
  const utils = chartData.map((d) => d.utilization)
  const avg = utils.reduce((sum, v) => sum + v, 0) / utils.length
  const variance = utils.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / utils.length
  const stdDev = Math.sqrt(variance)
  const cv = avg > 0 ? stdDev / avg : 0
  const fairnessScore = Math.max(0, Math.round(100 - cv * 100))

  return { chartData, fairnessScore, avgUtilization: Math.round(avg) }
}

/**
 * Color a bar based on utilization bucket.
 * Green (on target) → Yellow (under) → Red (over).
 */
function getUtilizationColor(utilization: number): string {
  if (utilization >= 80 && utilization <= 110) return '#00b894' // On target (green sync)
  if (utilization >= 60 && utilization < 80) return '#f59e0b' // Slightly under
  if (utilization > 110 && utilization <= 130) return '#f59e0b' // Slightly over
  if (utilization < 60) return '#ef4444' // Very under-scheduled
  return '#ef4444' // Very over-scheduled
}

function getFairnessColor(score: number): string {
  if (score >= 80) return '#00b894'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

function getFairnessLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 60) return 'Fair'
  if (score >= 40) return 'Uneven'
  return 'Poor'
}

/**
 * FairnessChart — Equity-focused scheduling visualization.
 *
 * Shows each employee's utilization % (hours / max hours) as colored bars,
 * with a target line at 100%. A computed fairness score (0-100) summarizes
 * how evenly distributed hours are across the team.
 */
export function FairnessChart({ activeWeekNumber }: { activeWeekNumber: number }) {
  const { activeSchedule } = useScheduleStore()
  const { employees } = useEmployeeStore()

  const { chartData, fairnessScore, avgUtilization } = useMemo(
    () => computeFairnessData(activeSchedule, employees, activeWeekNumber),
    [activeSchedule, employees, activeWeekNumber],
  )

  if (!activeSchedule) {
    return (
      <div className="fairness-chart empty-state">
        <p>No active schedule to analyze.</p>
        <span className="sr-only">Fairness Metrics</span>
      </div>
    )
  }

  return (
    <div className="fairness-chart">
      <div className="fairness-header">
        <h3 className="fairness-title">Fairness Metrics</h3>
        <div className="fairness-scores">
          <div className="fairness-score-pill">
            <span className="score-label">Equity Score</span>
            <span className="score-value" style={{ color: getFairnessColor(fairnessScore) }}>
              {fairnessScore}%
            </span>
            <span className="score-rating" style={{ color: getFairnessColor(fairnessScore) }}>
              {getFairnessLabel(fairnessScore)}
            </span>
          </div>
          <div className="fairness-score-pill">
            <span className="score-label">Avg Utilization</span>
            <span className="score-value">{avgUtilization}%</span>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', flex: 1, minHeight: 280 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} />
            <YAxis
              stroke="var(--color-text-muted)"
              fontSize={12}
              tickFormatter={(v: number) => `${v}%`}
              domain={[0, 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '0.8rem',
              }}
              itemStyle={{ color: 'var(--color-text-primary)' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => {
                return [`${value}%`, 'Utilization']
              }}
              labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 600 }}
            />
            <ReferenceLine
              y={100}
              stroke="var(--color-text-muted)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'Target',
                position: 'insideTopLeft',
                fill: 'var(--color-text-muted)',
                fontSize: 11,
              }}
            />
            <Bar dataKey="utilization" radius={[4, 4, 0, 0]} name="utilization">
              {chartData.map((entry, index) => (
                <Cell key={index} fill={getUtilizationColor(entry.utilization)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="fairness-legend" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        <span className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span className="legend-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#00b894' }} /> On target (80-110%)
        </span>
        <span className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span className="legend-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /> Slightly off
        </span>
        <span className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span className="legend-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} /> Needs attention
        </span>
      </div>
    </div>
  )
}
