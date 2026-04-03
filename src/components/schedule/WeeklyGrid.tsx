import React, { useMemo } from 'react'
import { DndContext, useDraggable, useDroppable, closestCenter } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { useScheduleStore } from '../../stores/scheduleStore'
import { useEmployeeStore } from '../../stores/employeeStore'
import { DAYS_OF_WEEK } from '../../types/index'
import type { Shift, Employee } from '../../types/index'
import './WeeklyGrid.css'

export const DraggableShift = React.memo(function DraggableShift({
  shift,
  employee,
  isAssigned,
}: {
  shift: Shift
  employee?: Employee
  isAssigned: boolean
}) {
  const assignmentId = isAssigned && employee ? `${shift.id}__${employee.id}` : shift.id

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: assignmentId,
    data: { shift, employee, isAssigned },
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        borderColor: employee ? employee.color : 'var(--primary)',
        boxShadow: employee ? `inset 4px 0 0 ${employee.color}` : 'inset 4px 0 0 #ef4444',
      }
    : {
        borderColor: employee ? employee.color : 'var(--border)',
        boxShadow: employee ? `inset 4px 0 0 ${employee.color}` : 'inset 4px 0 0 #ef4444',
      }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`wg-shift`}
      data-dragging={isDragging}
    >
      <div className="wg-shift-time">
        {shift.startTime} - {shift.endTime}
      </div>
    </div>
  )
})
export const DroppableCell = React.memo(function DroppableCell({
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
    <div ref={setNodeRef} className="wg-cell" data-is-over={isOver}>
      {children}
    </div>
  )
})
export function WeeklyGrid({ weekNumber = 0 }: { weekNumber?: number }) {
  const { activeSchedule, setActiveSchedule } = useScheduleStore()
  const { employees } = useEmployeeStore()

  // Pre-calculate shifts filtered strictly by this weekNumber
  const weeklyShifts = useMemo(() => {
    if (!activeSchedule) return []
    return activeSchedule.shifts.filter((s) => (s.weekNumber || 0) === weekNumber)
  }, [activeSchedule, weekNumber])

  // Track map of assignments: Map<ShiftId, EmployeeId[]>
  const assignmentsByShift = useMemo(() => {
    const map = new Map<string, string[]>()
    if (!activeSchedule) return map

    // Only map assignments for shifts in this week
    const validShiftIds = new Set(weeklyShifts.map((s) => s.id))
    activeSchedule.assignments.forEach((a) => {
      if (!validShiftIds.has(a.shiftId)) return
      const emps = map.get(a.shiftId) ?? []
      emps.push(a.employeeId)
      map.set(a.shiftId, emps)
    })
    return map
  }, [activeSchedule, weeklyShifts])

  const handleDragEnd = (event: DragEndEvent) => {
    if (!activeSchedule) return

    const { active, over } = event
    if (!over) return

    // active.id is the dragged shift piece
    const draggedData = active.data.current as {
      shift: Shift
      employee?: Employee
      isAssigned: boolean
    }

    // over.id is the droppable cell e.g., "unassigned-monday" or "empId-tuesday"
    const overId = String(over.id)
    const [targetType] = overId.split('-') // e.g. "unassigned" or employeeId

    if (!draggedData) return

    const shiftId = draggedData.shift.id

    // Create a new assignment list for mutation
    let newAssignments = [...activeSchedule.assignments]

    // If moving from an assigned employee to somewhere else, remove the old assignment
    if (draggedData.isAssigned && draggedData.employee) {
      newAssignments = newAssignments.filter(
        (a) => !(a.shiftId === shiftId && a.employeeId === draggedData.employee!.id),
      )
    }

    // If dropped onto an employee cell, add the new assignment
    if (targetType !== 'unassigned') {
      // Don't allow assigning the same employee to the same shift twice
      const alreadyAssigned = newAssignments.some(
        (a) => a.shiftId === shiftId && a.employeeId === targetType,
      )
      if (!alreadyAssigned) {
        newAssignments.push({
          id: crypto.randomUUID(),
          shiftId: shiftId,
          employeeId: targetType,
          isManual: true,
        })
      }
    }

    setActiveSchedule({
      ...activeSchedule,
      assignments: newAssignments,
      updatedAt: new Date().toISOString(),
    })
  }

  // Pre-calculate shift pools
  const shiftsByDay = useMemo(() => {
    const map = new Map<string, Shift[]>()
    if (!activeSchedule) return map
    weeklyShifts.forEach((s) => {
      const arr = map.get(s.day) ?? []
      arr.push(s)
      map.set(s.day, arr)
    })
    return map
  }, [activeSchedule, weeklyShifts])

  if (!activeSchedule) return null

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="wg-wrapper">
        <div className="wg-grid">
          {/* Top-Left Empty Corner */}
          <div className="wg-header-cell wg-corner">Roster</div>

          {/* Column Headers (Days) */}
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="wg-header-cell">
              {day}
            </div>
          ))}

          {/* Unassigned Pool Row */}
          <div className="wg-row-label wg-unassigned-pool">
            <span className="wg-emp-name">Unassigned / Need Staff</span>
            <span className="wg-emp-target">Pending fulfilling</span>
          </div>

          {DAYS_OF_WEEK.map((day) => {
            const dayShifts = shiftsByDay.get(day) ?? []
            // render shifts that still need staff
            const neededShifts: Shift[] = []

            dayShifts.forEach((shift) => {
              const assignedCount = assignmentsByShift.get(shift.id)?.length ?? 0
              if (assignedCount < shift.requiredStaff) {
                // If it needs 3 staff but has 1, render 2 draggable tiles!
                // Wait, if it has a unique shift ID from the expanded generator,
                // each shift only has requiredStaff=1 inherently, so we just check if it has 0 assignments.
                if (assignedCount === 0) {
                  neededShifts.push(shift)
                }
              }
            })

            return (
              <DroppableCell key={`unassigned-${day}`} id={`unassigned-${day}`} day={day}>
                {neededShifts.map((s) => (
                  <DraggableShift key={`pool-${s.id}`} shift={s} isAssigned={false} />
                ))}
              </DroppableCell>
            )
          })}

          {/* Employee Rows */}
          {employees.map((emp) => {
            // Calculate assigned hours this week for display
            const assignedShifts = activeSchedule.assignments
              .filter((a) => a.employeeId === emp.id)
              .map((a) => activeSchedule.shifts.find((s) => s.id === a.shiftId))
              .filter(Boolean) as Shift[]

            let totalHours = 0
            assignedShifts.forEach((s) => {
              const st = parseInt(s.startTime.split(':')[0], 10)
              const et = parseInt(s.endTime.split(':')[0], 10)
              totalHours += et > st ? et - st : 24 - st + et
            })

            return (
              <React.Fragment key={emp.id}>
                <div className="wg-row-label">
                  <span className="wg-emp-name">{emp.name}</span>
                  <span
                    className="wg-emp-target"
                    style={{ color: totalHours > emp.maxHoursPerWeek ? '#ef4444' : undefined }}
                  >
                    {totalHours}h / {emp.maxHoursPerWeek}h
                  </span>
                </div>

                {DAYS_OF_WEEK.map((day) => {
                  const empDayShifts = activeSchedule.assignments
                    .filter((a) => a.employeeId === emp.id)
                    .map((a) => activeSchedule.shifts.find((s) => s.id === a.shiftId))
                    .filter((s) => s?.day === day) as Shift[]

                  return (
                    <DroppableCell key={`${emp.id}-${day}`} id={`${emp.id}-${day}`} day={day}>
                      {empDayShifts.map((s) => (
                        <DraggableShift
                          key={`assigned-${s.id}-${emp.id}`}
                          shift={s}
                          employee={emp}
                          isAssigned={true}
                        />
                      ))}
                    </DroppableCell>
                  )
                })}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </DndContext>
  )
}
