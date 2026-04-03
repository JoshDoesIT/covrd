import { useMemo } from 'react'
import { useScheduleStore } from '../../stores/scheduleStore'
import { useEmployeeStore } from '../../stores/employeeStore'
import type { Employee } from '../../types/index'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

/**
 * FairnessChart
 * Visualizes employee hours vs max bounds to detect imbalances.
 */
export function FairnessChart() {
  const { activeSchedule } = useScheduleStore()
  const { employees } = useEmployeeStore()

  // Calculate actual hours dynamically
  const data = useMemo(() => {
    if (!activeSchedule || activeSchedule.assignments.length === 0) return []

    // Determine total weeks spanned
    const startTime = new Date(activeSchedule.startDate).getTime()
    const endTime = new Date(activeSchedule.endDate).getTime()
    const diff = endTime - startTime
    const totalWeeks = Math.max(1, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000)))

    // Map shifts by ID for quick hour lookup
    const shiftHours = new Map<string, number>()
    activeSchedule.shifts.forEach((s) => {
      const sh = parseInt(s.startTime.split(':')[0], 10)
      const eh = parseInt(s.endTime.split(':')[0], 10)
      const duration = eh > sh ? eh - sh : 24 - sh + eh
      shiftHours.set(s.id, duration)
    })

    // Accumulate sum per employee
    const acc = new Map<string, number>()
    activeSchedule.assignments.forEach((a) => {
      const current = acc.get(a.employeeId) ?? 0
      const dur = shiftHours.get(a.shiftId) ?? 0
      acc.set(a.employeeId, current + dur)
    })

    // Map to final chart data array, scaling bounds across multiple weeks
    return employees.map((emp: Employee) => {
      return {
        name: emp.name.split(' ')[0], // Short name representation
        hours: acc.get(emp.id) ?? 0,
        max: emp.maxHoursPerWeek * totalWeeks,
      }
    })
  }, [activeSchedule, employees])

  if (!activeSchedule) {
    return (
      <div className="fairness-chart empty-state">
        <p>No active schedule or employees to analyze.</p>
        <span className="sr-only">Fairness Metrics</span>
      </div>
    )
  }

  return (
    <div className="fairness-chart">
      <h3 className="fairness-title">Fairness Metrics</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" />
            <YAxis stroke="var(--text-muted)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
              }}
              itemStyle={{ color: 'var(--text-base)' }}
            />
            <Legend />
            <Bar dataKey="hours" fill="var(--secondary-color)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="max" fill="var(--text-muted)" opacity={0.3} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
