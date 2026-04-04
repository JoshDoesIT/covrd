import React, { useState } from 'react'
import { CalendarRange, ArrowLeft } from 'lucide-react'
import { useEmployeeStore } from '../../stores/employeeStore'
import { DAYS_OF_WEEK } from '../../types/index'
import type { DayOfWeek, TimeBlock } from '../../types/index'
import './AvailabilityGrid.css'

interface Props {
  employeeId: string
  onClose: () => void
}

/**
 * Simple generator returning 0-23 hours.
 */
const hours = Array.from({ length: 24 }, (_, i) => i)

function formatHour(h: number) {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

export function AvailabilityGrid({ employeeId, onClose }: Props) {
  const { getEmployeeById, updateEmployee } = useEmployeeStore()
  const employee = getEmployeeById(employeeId)

  // Internal state tracking matrix of [day][hour] = boolean
  const [matrix, setMatrix] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {}
    if (!employee) return initialState

    // Parse employee availability blocks into 1hr chunks for the matrix interface mapping
    employee.availability.forEach((dayAvail) => {
      dayAvail.blocks.forEach((block) => {
        const startHour = parseInt(block.startTime.split(':')[0], 10)
        const endHour = parseInt(block.endTime.split(':')[0], 10)
        for (let h = startHour; h < endHour; h++) {
          initialState[`${dayAvail.day}-${h}`] = true
        }
      })
    })
    return initialState
  })

  // Drag state
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState<boolean | null>(null) // true = selecting, false = unselecting

  const handlePointerDown = (e: React.PointerEvent, day: DayOfWeek, h: number) => {
    e.preventDefault()
    e.currentTarget.releasePointerCapture(e.pointerId)
    setIsDragging(true)
    const key = `${day}-${h}`
    const currentlySelected = !!matrix[key]
    setDragMode(!currentlySelected)

    setMatrix((prev) => ({ ...prev, [key]: !currentlySelected }))
  }

  const handlePointerEnter = (_e: React.PointerEvent, day: DayOfWeek, h: number) => {
    if (!isDragging || dragMode === null) return
    const key = `${day}-${h}`
    // Only update if it does not match drag mode
    if (!!matrix[key] !== dragMode) {
      setMatrix((prev) => ({ ...prev, [key]: dragMode }))
    }
  }

  const handlePointerUp = () => {
    setIsDragging(false)
    setDragMode(null)
  }

  const handleSave = () => {
    if (!employee) return

    // Reconstruct blocks per day from the 1-hour boolean matrix
    const newAvailability = DAYS_OF_WEEK.map((day) => {
      const blocks: TimeBlock[] = []
      let startH = -1

      for (let h = 0; h <= 24; h++) {
        const selected = h < 24 ? matrix[`${day}-${h}`] : false
        if (selected && startH === -1) {
          startH = h
        } else if (!selected && startH !== -1) {
          blocks.push({
            startTime: `${startH.toString().padStart(2, '0')}:00`,
            endTime: `${h.toString().padStart(2, '0')}:00`,
          })
          startH = -1
        }
      }

      return { day, blocks }
    })

    updateEmployee(employee.id, { availability: newAvailability })
    onClose()
  }

  if (!employee) return null

  return (
    <div
      className="availability-grid-container"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="ag-header">
        <div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginBottom: '0.5rem',
              padding: 0,
              alignSelf: 'flex-start',
            }}
          >
            <ArrowLeft size={14} /> Back to Profile
          </button>
          <h3 className="ag-title">
            <CalendarRange size={16} color="var(--primary)" />
            {employee.name || 'New Employee'}'s Availability
          </h3>
          <p className="ag-subtitle">
            Click and drag to mark available working hours. If nothing is selected, this employee is
            considered available at all times.
          </p>
        </div>
        <div className="ag-controls">
          <button className="ag-btn" onClick={() => setMatrix({})}>
            Clear All
          </button>
          <button
            className="ag-btn"
            onClick={handleSave}
            style={{
              background: 'var(--primary)',
              color: 'var(--bg-base)',
              borderColor: 'var(--primary)',
            }}
          >
            Save Matrix
          </button>
        </div>
      </div>

      <div className="ag-grid-wrapper">
        <div className="ag-grid">
          {/* Top-Left Corner */}
          <div className="ag-cell ag-corner"></div>

          {/* Days Headers */}
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="ag-cell ag-header-col">
              {day.substring(0, 3)}
            </div>
          ))}

          {/* Rows (Hour Headers + Cells) */}
          {hours.map((h) => (
            <React.Fragment key={h}>
              <div className="ag-cell ag-header-row">{formatHour(h)}</div>
              {DAYS_OF_WEEK.map((day) => {
                const key = `${day}-${h}`
                return (
                  <div
                    key={key}
                    className="ag-cell ag-block"
                    data-selected={!!matrix[key]}
                    onPointerDown={(e) => handlePointerDown(e, day, h)}
                    onPointerEnter={(e) => handlePointerEnter(e, day, h)}
                  />
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
