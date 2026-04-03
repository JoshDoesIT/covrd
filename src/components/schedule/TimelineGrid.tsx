import { useMemo } from 'react'
import { useScheduleStore } from '../../stores/scheduleStore'
import { useEmployeeStore } from '../../stores/employeeStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { DAYS_OF_WEEK } from '../../types/index'
import type { DayOfWeek, Shift } from '../../types/index'
import { formatTime } from '../../utils/formatTime'
import './TimelineGrid.css'

export function TimelineGrid() {
  const { activeSchedule } = useScheduleStore()
  const { employees } = useEmployeeStore()
  const { timeFormat } = useSettingsStore()

  // Pre-compute shift assignments by employee and day
  const timelineData = useMemo(() => {
    if (!activeSchedule) return null

    const data: Record<string, Record<DayOfWeek, Shift[]>> = {}
    
    // Initialize structure
    employees.forEach((emp) => {
      data[emp.id] = {
        monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
      }
    })

    // Map shifts for quick lookup
    const shiftMap = new Map<string, Shift>()
    activeSchedule.shifts.forEach((s: Shift) => shiftMap.set(s.id, s))

    // Populate assignments
    activeSchedule.assignments.forEach((a) => {
      if (!data[a.employeeId]) return
      const shift = shiftMap.get(a.shiftId)
      if (shift) {
        data[a.employeeId][shift.day].push(shift)
      }
    })

    return data
  }, [activeSchedule, employees])

  if (!activeSchedule || !timelineData) {
    return (
      <div className="timeline-grid empty-state">
        <p>No active schedule blocks generated yet.</p>
        <span className="sr-only">Timeline Gantt View</span>
      </div>
    )
  }

  // Helper to convert HH:MM to a percentage of a 24-hour day (0-100)
  const timeToPercentage = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number)
    const totalHours = (h || 0) + ((m || 0) / 60)
    return (totalHours / 24) * 100
  }

  return (
    <div className="timeline-grid">
      <div className="timeline-header">
        <h3 className="sr-only">Timeline Gantt View</h3>
      </div>

      <div className="timeline-wrapper">
        <table className="timeline-table">
          <thead>
            <tr>
              <th className="timeline-emp-col">Employee</th>
              {DAYS_OF_WEEK.map((day) => (
                <th key={day} className="timeline-day-col">
                  {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                  <div className="timeline-time-ticks">
                     {/* Mini markers for 6am, 12pm, 6pm just for visual scale */}
                     <span style={{ left: '25%' }}>6a</span>
                     <span style={{ left: '50%' }}>12p</span>
                     <span style={{ left: '75%' }}>6p</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td className="timeline-emp-name">
                  <div className="emp-color-dot" style={{ backgroundColor: emp.color }} />
                  {emp.name}
                </td>
                {DAYS_OF_WEEK.map((day) => {
                  const shifts = timelineData[emp.id][day]
                  return (
                    <td key={day} className="timeline-cell">
                      {shifts.map((shift) => {
                        const left = timeToPercentage(shift.startTime)
                        const right = timeToPercentage(shift.endTime)
                        let width = right - left
                        // Handle overnight wrap (simple display constraint)
                        if (width < 0) width = 100 - left

                        return (
                          <div
                            key={shift.id}
                            className="timeline-block"
                            style={{
                              left: `${left}%`,
                              width: `${Math.max(1, width)}%`,
                              backgroundColor: `${emp.color}30`,
                              borderColor: emp.color
                            }}
                            title={`${formatTime(shift.startTime, timeFormat)} - ${formatTime(shift.endTime, timeFormat)}`}
                          >
                            <span className="timeline-block-time">
                              {formatTime(shift.startTime, timeFormat)}
                            </span>
                          </div>
                        )
                      })}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
