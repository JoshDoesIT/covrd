import { useScheduleStore } from '../../stores/scheduleStore'
import { useEmployeeStore } from '../../stores/employeeStore'
import './TimelineGrid.css'

export function TimelineGrid() {
  const { activeSchedule } = useScheduleStore()
  const { employees } = useEmployeeStore()

  if (!activeSchedule) {
    return (
      <div className="timeline-grid empty-state">
        <p>No active schedule blocks generated yet.</p>
        <span className="sr-only">Timeline Gantt View</span>
      </div>
    )
  }

  // Very basic Gantt mapping: Rows = Employees, Columns = Days
  // A robust Gantt would map out time blocks horizontally across hours
  return (
    <div className="timeline-grid">
      <div className="timeline-header">
        <h3 className="sr-only">Timeline Gantt View</h3>
        <p className="text-muted">Gantt visualization pending complete time-block scalar mapping.</p>
      </div>

      <div className="timeline-wrapper">
        <table className="timeline-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Mon</th>
              <th>Tue</th>
              <th>Wed</th>
              <th>Thu</th>
              <th>Fri</th>
              <th>Sat</th>
              <th>Sun</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td className="timeline-emp-name">{emp.name}</td>
                {/* Mocked out timeline scalar blocks for now */}
                <td><div className="timeline-block" style={{ width: '100%' }}></div></td>
                <td><div className="timeline-block" style={{ width: '50%' }}></div></td>
                <td></td>
                <td><div className="timeline-block" style={{ width: '80%' }}></div></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
