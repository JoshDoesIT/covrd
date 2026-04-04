import React, { useMemo } from 'react'
import { DndContext, useDraggable, useDroppable, pointerWithin } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { useScheduleStore } from '../../stores/scheduleStore'
import { useEmployeeStore } from '../../stores/employeeStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { DAYS_OF_WEEK } from '../../types/index'
import type { DayOfWeek, Shift, Employee } from '../../types/index'
import { formatDayHeader } from '../../utils/scheduleDates'
import { formatTime } from '../../utils/formatTime'
import './TimelineGrid.css'

export const TimelineDraggableBlock = React.memo(function TimelineDraggableBlock({
  shift,
  employee,
  left,
  width,
}: {
  shift: Shift
  employee: Employee
  left: number
  width: number
}) {
  const { timeFormat } = useSettingsStore()
  const assignmentId = `${shift.id}__${employee.id}`

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: assignmentId,
    data: { shift, employee, isAssigned: true },
  })

  // We layer transform x/y on top of our absolutely positioned left/width
  const style: React.CSSProperties = {
    left: `${left}%`,
    width: `${width}%`,
    backgroundColor: `${employee.color}30`,
    borderColor: employee.color,
    ...(transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          zIndex: 50,
          opacity: 0.8,
        }
      : {}),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`timeline-block ${isDragging ? 'dragging' : ''}`}
      title={`${formatTime(shift.startTime, timeFormat)} - ${formatTime(shift.endTime, timeFormat)}`}
    >
      <span className="timeline-block-time">{formatTime(shift.startTime, timeFormat)}</span>
    </div>
  )
})

export const TimelineDroppableCell = React.memo(function TimelineDroppableCell({
  id,
  day,
  children,
}: {
  id: string
  day: string
  children: React.ReactNode
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { day },
  })

  return (
    <td
      ref={setNodeRef}
      className={`timeline-cell ${isOver ? 'wg-cell-is-over' : ''}`} // Reuse the subtle background glow if needed
      style={isOver ? { backgroundColor: 'rgba(255, 255, 255, 0.05)' } : {}}
    >
      {children}
    </td>
  )
})

export function TimelineGrid({
  weekNumber = 0,
  startDate,
}: {
  weekNumber?: number
  startDate?: string
}) {
  const { activeSchedule } = useScheduleStore()
  const { employees } = useEmployeeStore()

  // Pre-compute shift assignments by employee and day
  const timelineData = useMemo(() => {
    if (!activeSchedule) return null

    const data: Record<string, Record<DayOfWeek, Shift[]>> = {}

    // Initialize structure
    employees.forEach((emp) => {
      data[emp.id] = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      }
    })

    // Map shifts for quick lookup
    const shiftMap = new Map<string, Shift>()
    activeSchedule.shifts.forEach((s: Shift) => shiftMap.set(s.id, s))

    // Filter shifts strictly by this weekNumber and that have assignments
    const validShiftIds = new Set(
      activeSchedule.shifts.filter((s) => (s.weekNumber || 0) === weekNumber).map((s) => s.id),
    )

    // Populate assignments
    activeSchedule.assignments.forEach((a) => {
      if (!data[a.employeeId] || !validShiftIds.has(a.shiftId)) return
      const shift = shiftMap.get(a.shiftId)
      if (shift) {
        data[a.employeeId][shift.day].push(shift)
      }
    })

    return data
  }, [activeSchedule, employees, weekNumber])

  const handleDragEnd = (event: DragEndEvent) => {
    if (!activeSchedule) return

    const { active, over } = event
    if (!over) return

    // active.id is the dragged assignment (shift.id__employee.id)
    const draggedData = active.data.current as {
      shift: Shift
      employee: Employee
      isAssigned: boolean
    }

    if (!draggedData) return

    const shiftId = draggedData.shift.id
    const oldEmployeeId = draggedData.employee.id

    // over.id is the target cell e.g. "empId-day"
    const overId = String(over.id)
    const lastDash = overId.lastIndexOf('-')
    const targetEmployeeId = overId.substring(0, lastDash)

    // We don't drop to unassigned in timeline view right now, but we can reassign
    if (targetEmployeeId === oldEmployeeId) return // No change

    let newAssignments = [...activeSchedule.assignments]

    // Remove old
    newAssignments = newAssignments.filter(
      (a) => !(a.shiftId === shiftId && a.employeeId === oldEmployeeId),
    )

    // Ensure they don't already have this exact shift
    const alreadyAssigned = newAssignments.some(
      (a) => a.shiftId === shiftId && a.employeeId === targetEmployeeId,
    )

    if (!alreadyAssigned) {
      newAssignments.push({
        id: crypto.randomUUID(),
        shiftId: shiftId,
        employeeId: targetEmployeeId,
        isManual: true,
      })
    }

    useScheduleStore.getState().setActiveSchedule({
      ...activeSchedule,
      assignments: newAssignments,
      updatedAt: new Date().toISOString(),
    })
  }

  if (!activeSchedule || !timelineData) {
    return (
      <div className="timeline-grid empty-state">
        <p>No active schedule blocks generated yet.</p>
        <span className="sr-only">Timeline View</span>
      </div>
    )
  }

  // Helper to convert HH:MM to a percentage of a 24-hour day (0-100)
  const timeToPercentage = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number)
    const totalHours = (h || 0) + (m || 0) / 60
    return (totalHours / 24) * 100
  }

  return (
    <DndContext collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      <div className="timeline-grid">
        <div className="timeline-header">
          <h3 className="sr-only">Timeline View</h3>
        </div>

        <div className="timeline-wrapper">
          <table className="timeline-table">
            <thead>
              <tr>
                <th className="timeline-emp-col">Employee</th>
                {DAYS_OF_WEEK.map((day) => (
                  <th key={day} className="timeline-day-col">
                    {startDate
                      ? formatDayHeader(startDate, weekNumber, day)
                      : day.charAt(0).toUpperCase() + day.slice(1, 3)}
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
                      <TimelineDroppableCell
                        key={`${emp.id}-${day}`}
                        id={`${emp.id}-${day}`}
                        day={day}
                      >
                        {shifts.map((shift) => {
                          const left = timeToPercentage(shift.startTime)
                          const right = timeToPercentage(shift.endTime)
                          let width = right - left
                          if (width < 0) width = 100 - left

                          return (
                            <TimelineDraggableBlock
                              key={shift.id}
                              shift={shift}
                              employee={emp}
                              left={left}
                              width={Math.max(1, width)}
                            />
                          )
                        })}
                      </TimelineDroppableCell>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile-friendly card layout — visible only at ≤768px via CSS */}
        <div className="timeline-mobile">
          {DAYS_OF_WEEK.map((day) => {
            const dayLabel = startDate
              ? formatDayHeader(startDate, weekNumber, day)
              : day.charAt(0).toUpperCase() + day.slice(1)

            // Gather all shifts for this day across all employees
            const dayShifts: { employee: Employee; shift: Shift }[] = []
            employees.forEach((emp) => {
              const shifts = timelineData[emp.id]?.[day] ?? []
              shifts.forEach((shift) => dayShifts.push({ employee: emp, shift }))
            })

            return (
              <div key={day} className="timeline-mobile-day">
                <div className="timeline-mobile-day-header">{dayLabel}</div>
                {dayShifts.length === 0 ? (
                  <div className="timeline-mobile-empty">No shifts</div>
                ) : (
                  dayShifts.map(({ employee: emp, shift }) => (
                    <div key={shift.id} className="timeline-mobile-shift">
                      <div className="timeline-mobile-dot" style={{ backgroundColor: emp.color }} />
                      <span className="timeline-mobile-name">{emp.name}</span>
                      <span className="timeline-mobile-time">
                        {formatTime(shift.startTime, '12h')} – {formatTime(shift.endTime, '12h')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )
          })}
        </div>
      </div>
    </DndContext>
  )
}
