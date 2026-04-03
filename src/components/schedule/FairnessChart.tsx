import { useScheduleStore } from '../../stores/scheduleStore'
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

  // Build basic mock data for now
  const data = [
    { name: 'Alice', hours: 32, max: 40 },
    { name: 'Bob', hours: 45, max: 40 }, // Overtime!
    { name: 'Charlie', hours: 20, max: 20 },
  ]

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
