import { useState } from 'react'
import { Sparkles, CalendarDays, RefreshCw, XCircle, Undo2, Redo2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useScheduleStore } from '../../stores/scheduleStore'
import { useEmployeeStore } from '../../stores/employeeStore'
import { useCoverageStore } from '../../stores/coverageStore'
import { generateScheduleAsync } from '../../engine/worker/client'
import { createSchedule, createShift } from '../../types/factories'
import type { Shift, ShiftAssignment } from '../../types/index'
import { useTemplateStore } from '../../stores/templateStore'
import { WeeklyGrid } from './WeeklyGrid'
import { TimelineGrid } from './TimelineGrid'
import { CoverageHeatmap } from './CoverageHeatmap'
import { FairnessChart } from './FairnessChart'
import { ShareToolbar } from './ShareToolbar'
import { readFileAsText, deserializeScheduleJSON } from '../../utils/exportSchedule'
import { getNextMonday, formatWeekRange } from '../../utils/scheduleDates'
import { EmptyState } from '../shared/EmptyState'
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
    allSchedules,
    activeSchedule,
    setActiveSchedule,
    clearActiveSchedule,
    isSandboxMode,
    enableSandbox,
    commitSandbox,
    discardSandbox,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useScheduleStore()
  const { employees } = useEmployeeStore()
  const { requirements } = useCoverageStore()
  const { templates } = useTemplateStore()

  const [viewMode, setViewMode] = useState<ViewMode>('matrix')

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [errorStatus, setErrorStatus] = useState<string | null>(null)
  
  // Format initial date as YYYY-MM-DD string for HTML input
  const [targetStartDate, setTargetStartDate] = useState(() => {
    const d = getNextMonday()
    // Avoid UTC timezone shifting when formatting as string
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

  const handleGenerate = async () => {
    const pendingTemplateId = useScheduleStore.getState().pendingTemplateId
    const template = pendingTemplateId ? templates.find((t) => t.id === pendingTemplateId) : null

    if (employees.length === 0 || (!template && requirements.length === 0)) {
      alert('You must configure at least 1 employee and 1 coverage requirement first.')
      return
    }

    // Warn if replacing an existing schedule
    if (activeSchedule && activeSchedule.assignments.length > 0) {
      const confirmed = confirm(
        'This will replace your current schedule with a newly generated one. Continue?',
      )
      if (!confirmed) return
    }

    // Clear pending template flag once we begin
    useScheduleStore.getState().setPendingTemplateId(null)

    setIsGenerating(true)
    setProgress(0)
    setErrorStatus(null)

    let generatedShifts: Shift[] = []
    let totalWeeks = 1

    if (template) {
      // Epic 5: Multi-week schedule expansion
      if (template.pattern.kind === 'biweekly') totalWeeks = 2
      else if (template.pattern.kind === 'rotation')
        totalWeeks = template.pattern.cycleLength || 4 // default 4 if empty
      else if (template.pattern.kind === 'monthly') totalWeeks = 4

      for (let w = 0; w < totalWeeks; w++) {
        const weeklyOffsetShifts = template.coverageRequirements.map((r) =>
          createShift({
            day: r.day,
            startTime: r.startTime,
            endTime: r.endTime,
            requiredStaff: r.requiredStaff,
            weekNumber: w, // assign the explicit week instance
          }),
        )
        generatedShifts.push(...weeklyOffsetShifts)
      }
    } else {
      // Epic 4 fallback (1 week from manual baseline requirements)
      generatedShifts = requirements.map((r) =>
        createShift({
          day: r.day,
          startTime: r.startTime,
          endTime: r.endTime,
          requiredStaff: r.requiredStaff,
          weekNumber: 0,
        }),
      )
    }

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
      // Engine shift IDs are "${baseShiftId}-${expansionIndex}" — strip the last "-N" suffix
      const finalAssignments: ShiftAssignment[] = result.assignedShifts
        .filter((s) => s.employeeId)
        .map((a) => ({
          id: crypto.randomUUID(),
          shiftId: a.id.substring(0, a.id.lastIndexOf('-')),
          employeeId: a.employeeId!,
          isManual: false,
        }))

      // Ensure the start date behaves as local-time midnight
      const baseDate = new Date(`${targetStartDate}T00:00:00`)
      // Pass the explicit date to getNextMonday to enforce Monday alignment securely
      const actualStartMonday = getNextMonday(baseDate)

      const newSchedule = createSchedule({
        name: template
          ? `Generated from ${template.name}`
          : `Auto Generated - Week of ${actualStartMonday.toLocaleDateString()}`,
        startDate: actualStartMonday.toISOString(),
        endDate: new Date(actualStartMonday.getTime() + totalWeeks * 7 * 24 * 60 * 60 * 1000).toISOString(),
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h2 className="sm-title">
              <CalendarDays size={20} color="var(--color-accent)" />
              Schedule Builder
            </h2>
            <p className="sm-subtitle">Interactive visualization and solver dispatch.</p>
          </div>

          {/* Pagination Controls */}
          {activeSchedule && allSchedules.length > 1 && (
            <div style={{ display: 'flex', gap: '0.25rem', paddingLeft: '1rem', borderLeft: '1px solid var(--color-border)' }}>
              <button
                className="sm-btn-ghost"
                onClick={() => {
                  const sorted = [...allSchedules].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  const idx = sorted.findIndex(s => s.id === activeSchedule.id)
                  if (idx > 0) setActiveSchedule(sorted[idx - 1])
                }}
                disabled={(() => {
                  const sorted = [...allSchedules].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  return sorted.findIndex(s => s.id === activeSchedule.id) <= 0
                })()}
                title="View previous schedule"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="sm-btn-ghost"
                onClick={() => {
                  const sorted = [...allSchedules].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  const idx = sorted.findIndex(s => s.id === activeSchedule.id)
                  if (idx !== -1 && idx < sorted.length - 1) setActiveSchedule(sorted[idx + 1])
                }}
                disabled={(() => {
                  const sorted = [...allSchedules].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  const idx = sorted.findIndex(s => s.id === activeSchedule.id)
                  return idx === -1 || idx >= sorted.length - 1
                })()}
                title="View next schedule"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
        <div className="sm-actions">
          {activeSchedule && (
            <>
              <div className="sm-view-toggle">
                <button
                  className={`sm-view-btn ${viewMode === 'matrix' ? 'sm-view-btn--active' : ''}`}
                  onClick={() => setViewMode('matrix')}
                >
                  Matrix
                </button>
                <button
                  className={`sm-view-btn ${viewMode === 'timeline' ? 'sm-view-btn--active' : ''}`}
                  onClick={() => setViewMode('timeline')}
                >
                  Timeline
                </button>
              </div>

              {canUndo || canRedo ? (
                <div style={{ display: 'flex', gap: '0.25rem', marginRight: '1rem' }}>
                  <button
                    className="sm-btn-ghost"
                    onClick={undo}
                    disabled={!canUndo}
                    title="Undo latest manual assignment change"
                  >
                    <Undo2 size={16} />
                  </button>
                  <button
                    className="sm-btn-ghost"
                    onClick={redo}
                    disabled={!canRedo}
                    title="Redo manual change"
                  >
                    <Redo2 size={16} />
                  </button>
                </div>
              ) : null}

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

              <ShareToolbar
                state={{
                  employees,
                  coverageRequirements: requirements,
                  schedule: activeSchedule,
                }}
                onImport={async (file) => {
                  try {
                    const text = await readFileAsText(file)
                    const imported = deserializeScheduleJSON(text)
                    setActiveSchedule(imported.schedule)
                  } catch (err: unknown) {
                    setErrorStatus(err instanceof Error ? err.message : 'Failed to import schedule')
                  }
                }}
              />
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
               <label htmlFor="sm-start-date" style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.1rem', paddingLeft: '2px' }}>Start Week (Mon)</label>
               <input 
                 id="sm-start-date"
                 type="date"
                 value={targetStartDate}
                 onChange={(e) => {
                   const val = e.target.value
                   if (!val) return
                   // Enforce Monday selection visually if they typed it manually
                   const d = new Date(`${val}T00:00:00`)
                   if (d.getDay() !== 1) {
                     // Snap to the Monday
                     const nextMon = getNextMonday(d)
                     setTargetStartDate(`${nextMon.getFullYear()}-${String(nextMon.getMonth() + 1).padStart(2, '0')}-${String(nextMon.getDate()).padStart(2, '0')}`)
                   } else {
                     setTargetStartDate(val)
                   }
                 }}
                 // Optional HTML5 validation trick: step by 7 days starting from a known Monday
                 // step="7" 
                 style={{ 
                   background: 'var(--color-bg-elevated)',
                   color: 'var(--color-text-primary)',
                   border: '1px solid var(--color-border)',
                   padding: '0.4rem 0.5rem',
                   borderRadius: 'var(--radius-lg)',
                   fontSize: '0.85rem'
                 }}
               />
            </div>
            
            <button className="sm-btn-generate" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <RefreshCw size={16} className="lucide-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {isGenerating ? 'Solving...' : 'Automagic Schedule'}
          </button>
          </div>
        </div>
      </header>

      <div className="sm-content">
        {isGenerating && (
          <div className="sm-overlay">
            <Sparkles
              size={48}
              color="var(--color-accent)"
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
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ color: 'var(--color-text-primary)', margin: 0 }}>
                  {activeSchedule.name}
                </h3>
                <p
                  style={{
                    margin: '0.25rem 0 0 0',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)',
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

            <div
              className="scroll-matrix-wrapper"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '3rem',
                padding: '1rem',
                overflowY: 'auto',
              }}
            >
              {Array.from({
                length:
                  Math.ceil(
                    (new Date(activeSchedule.endDate).getTime() -
                      new Date(activeSchedule.startDate).getTime()) /
                      (7 * 24 * 60 * 60 * 1000),
                  ) || 1,
              }).map((_, i) => (
                <div key={i} className="weekly-block">
                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-muted)' }}>
                    Week {i + 1} <span style={{ opacity: 0.6, fontSize: '0.9em', marginLeft: '0.5rem' }}>({formatWeekRange(activeSchedule.startDate, i)})</span>
                  </h4>
                  {viewMode === 'matrix' ? (
                    <WeeklyGrid weekNumber={i} startDate={activeSchedule.startDate} />
                  ) : (
                    <TimelineGrid weekNumber={i} startDate={activeSchedule.startDate} />
                  )}
                </div>
              ))}
            </div>

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
            <div style={{ margin: '4rem auto', width: '100%', maxWidth: 400 }}>
              <EmptyState
                title="No Active Schedule"
                description="Trigger the solver engine to generate a mathematically optimized schedule based on your coverage requirements and employee constraints."
                icon={<Sparkles size={32} opacity={0.5} />}
                ctaLabel="Automagic Schedule"
                onCtaClick={handleGenerate}
              />
            </div>
          )
        )}
      </div>
    </div>
  )
}
