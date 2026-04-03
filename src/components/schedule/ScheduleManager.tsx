import { useState } from 'react'
import { Sparkles, CalendarDays, RefreshCw, XCircle } from 'lucide-react'
import { useScheduleStore } from '../../stores/scheduleStore'
import { useEmployeeStore } from '../../stores/employeeStore'
import { useCoverageStore } from '../../stores/coverageStore'
import { generateScheduleAsync } from '../../engine/worker/client'
import { createSchedule, createShift } from '../../types/factories'
import type { Shift, ShiftAssignment } from '../../types/index'
import { WeeklyGrid } from './WeeklyGrid'
import { TimelineGrid } from './TimelineGrid'
import { CoverageHeatmap } from './CoverageHeatmap'
import { FairnessChart } from './FairnessChart'
import './ScheduleManager.css'

type ViewMode = 'matrix' | 'timeline'

import type { EngineEmployee, EngineShift } from '../../engine/types'

const DAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

export function ScheduleManager() {
  const {
    activeSchedule,
    setActiveSchedule,
    clearActiveSchedule,
    isSandboxMode,
    enableSandbox,
    commitSandbox,
    discardSandbox,
  } = useScheduleStore()
  const { employees } = useEmployeeStore()
  const { requirements } = useCoverageStore()

  const [viewMode, setViewMode] = useState<ViewMode>('matrix')

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [errorStatus, setErrorStatus] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (employees.length === 0 || requirements.length === 0) {
      alert('You must configure at least 1 employee and 1 coverage requirement first.')
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setErrorStatus(null)

    // Convert Requirements to concrete shifts for the timeframe
    // For Epic 4 scope, we map 1 Requirement -> 1 Shift
    const generatedShifts: Shift[] = requirements.map((r) =>
      createShift({
        day: r.day,
        startTime: r.startTime,
        endTime: r.endTime,
        requiredStaff: r.requiredStaff,
      }),
    )

    // MAP TO ENGINE DTOs
    const engineEmployees: EngineEmployee[] = employees.map((e) => ({
      id: e.id,
      name: e.name,
      role: e.role,
      maxHours: e.maxHoursPerWeek,
      minHours: e.minHoursPerWeek,
      targetHours: e.maxHoursPerWeek, // Simplified for now
      isFullTime: e.employmentType === 'full-time',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      availability: e.availability.map((a) => ({
        dayOfWeek: DAY_MAP[a.day] ?? 0,
        isAvailable: a.blocks.length > 0,
        preferences: a.blocks.map((b) => ({ start: b.startTime, end: b.endTime })),
      })),
    }))

    const engineShifts: EngineShift[] = []
    generatedShifts.forEach((s) => {
      const startH = parseInt(s.startTime.split(':')[0], 10)
      const endH = parseInt(s.endTime.split(':')[0], 10)
      const duration = endH > startH ? endH - startH : 24 - startH + endH

      // Expand requiredStaff to individual engine shifts
      for (let i = 0; i < s.requiredStaff; i++) {
        engineShifts.push({
          id: `${s.id}-${i}`,
          dayOfWeek: DAY_MAP[s.day] ?? 0,
          start: s.startTime,
          end: s.endTime,
          role: 'any',
          durationHours: duration,
          isAssigned: false,
        })
      }
    })

    try {
      const result = await generateScheduleAsync(engineEmployees, engineShifts, (p) => {
        setProgress(Math.round(p * 100))
      })

      // Convert engine result assignments to UI format
      const finalAssignments: ShiftAssignment[] = result.assignedShifts
        .filter((s) => s.employeeId)
        .map((a) => ({
          id: crypto.randomUUID(),
          shiftId: a.id.split('-')[0], // Extract base shift ID from expanded suffix
          employeeId: a.employeeId!,
          isManual: false,
        }))

      const newSchedule = createSchedule({
        name: `Auto Generated - Week of ${new Date().toLocaleDateString()}`,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        shifts: generatedShifts,
        assignments: finalAssignments,
        qualityScore: result.success ? 100 : 0,
        unfilledShiftIds: result.unfilledShifts.map((s) => s.id),
      })

      setActiveSchedule(newSchedule)
    } catch (err: unknown) {
      setErrorStatus(err instanceof Error ? err.message : 'Solver Engine Failed')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="schedule-manager">
      <header className="sm-header">
        <div>
          <h2 className="sm-title">
            <CalendarDays size={20} color="var(--primary)" />
            Schedule Builder
          </h2>
          <p className="sm-subtitle">Interactive visualization and solver dispatch.</p>
        </div>
        <div className="sm-actions">
          {activeSchedule && (
            <>
              <div
                className="sm-view-toggle"
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginRight: '1rem',
                  alignItems: 'center',
                }}
              >
                <button
                  className={`sm-btn-ghost ${viewMode === 'matrix' ? 'active' : ''}`}
                  onClick={() => setViewMode('matrix')}
                >
                  Matrix
                </button>
                <button
                  className={`sm-btn-ghost ${viewMode === 'timeline' ? 'active' : ''}`}
                  onClick={() => setViewMode('timeline')}
                >
                  Timeline
                </button>
              </div>

              {isSandboxMode ? (
                <>
                  <button
                    className="sm-btn-ghost"
                    style={{ color: '#ef4444' }}
                    onClick={discardSandbox}
                  >
                    Discard Sandbox
                  </button>
                  <button
                    className="sm-btn-ghost"
                    style={{ color: '#10b981' }}
                    onClick={commitSandbox}
                  >
                    Commit sandbox
                  </button>
                </>
              ) : (
                <button className="sm-btn-ghost" onClick={enableSandbox} title="What-If Sandbox">
                  Sandbox Mode
                </button>
              )}

              <button className="sm-btn-ghost" onClick={clearActiveSchedule}>
                Clear View
              </button>
            </>
          )}
          <button className="sm-btn-generate" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <RefreshCw size={16} className="lucide-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {isGenerating ? 'Solving...' : 'Automagic Schedule'}
          </button>
        </div>
      </header>

      <div className="sm-content">
        {isGenerating && (
          <div className="sm-overlay">
            <Sparkles
              size={48}
              color="var(--primary)"
              className="lucide-spin"
              style={{ animationDuration: '3s' }}
            />
            <div className="sm-progress-container">
              <div className="sm-progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <span className="sm-loading-text">
              {progress < 30
                ? 'Analyzing constraints...'
                : progress < 70
                  ? 'Running heuristics...'
                  : 'Optimizing fairness...'}{' '}
              {progress}%
            </span>
          </div>
        )}

        {errorStatus && (
          <div className="sm-overlay">
            <XCircle size={40} color="#ef4444" />
            <h3 style={{ color: '#fff' }}>Solver Error</h3>
            <p style={{ color: '#aaa', maxWidth: 400, textAlign: 'center' }}>{errorStatus}</p>
            <button className="sm-btn-ghost" onClick={() => setErrorStatus(null)}>
              Dismiss
            </button>
          </div>
        )}

        {activeSchedule ? (
          <div className="sm-grid-container" style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                padding: '1rem',
                background: 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ color: 'var(--text-base)', margin: 0 }}>{activeSchedule.name}</h3>
                <p
                  style={{
                    margin: '0.25rem 0 0 0',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  Generated {activeSchedule.assignments.length} assignments.
                  {activeSchedule.unfilledShiftIds.length > 0 && (
                    <span style={{ color: '#ef4444', marginLeft: '1rem' }}>
                      Warning: Missing staff!
                    </span>
                  )}
                </p>
              </div>
            </div>

            {isSandboxMode && (
              <div
                className="sandbox-banner"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  padding: '0.75rem 1rem',
                  margin: '0 1rem 1rem',
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              >
                Sandbox Mode Active: Edits below are isolated.
              </div>
            )}

            {viewMode === 'matrix' ? <WeeklyGrid /> : <TimelineGrid />}

            <div
              className="schedule-analytics"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
                padding: '2rem',
              }}
            >
              <CoverageHeatmap />
              <FairnessChart />
            </div>
          </div>
        ) : (
          !isGenerating &&
          !errorStatus && (
            <div className="sm-empty">
              <Sparkles size={40} opacity={0.5} />
              <p>Click Automagic Schedule to map your requirements through the solver.</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
