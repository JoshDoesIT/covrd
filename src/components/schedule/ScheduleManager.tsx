import { useState } from 'react'
import {
  Sparkles,
  CalendarDays,
  RefreshCw,
  XCircle,
  Undo2,
  Redo2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useScheduleStore } from '../../stores/scheduleStore'
import { useEmployeeStore } from '../../stores/employeeStore'
import { useCoverageStore } from '../../stores/coverageStore'
import { generateScheduleAsync } from '../../engine/worker/client'
import { createSchedule, createShift } from '../../types/factories'
import type { Shift, ShiftAssignment, DayOfWeek, Employee, CoverageRequirement, BaselineRequirement } from '../../types/index'
import { WeeklyGrid } from './WeeklyGrid'
import { TimelineGrid } from './TimelineGrid'
import { CoverageHeatmap } from './CoverageHeatmap'
import { FairnessChart } from './FairnessChart'
import { ShareToolbar } from './ShareToolbar'
import { readFileAsText, deserializeScheduleJSON } from '../../utils/exportSchedule'
import { getNextMonday, formatWeekRange } from '../../utils/scheduleDates'
import { EmptyState } from '../shared/EmptyState'
import { Toast } from '../tooling/Toast'
import { covrdDb } from '../../db/db'
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
    undo,
    redo,
    canUndo,
    canRedo,
  } = useScheduleStore()
  const { employees } = useEmployeeStore()
  const { requirements, baselineRequirements } = useCoverageStore()

  const [viewMode, setViewMode] = useState<ViewMode>('matrix')
  const [activeWeekNumber, setActiveWeekNumber] = useState(0)

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [errorStatus, setErrorStatus] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Format initial date as YYYY-MM-DD string for HTML input
  const [targetStartDate, setTargetStartDate] = useState(() => {
    const d = getNextMonday()
    // Avoid UTC timezone shifting when formatting as string
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

  const [isConfirmingGenerate, setIsConfirmingGenerate] = useState(false)

  const handleGenerateClick = () => {
    if (
      employees.length === 0 ||
      (requirements.length === 0 && baselineRequirements.length === 0)
    ) {
      setErrorStatus('You must configure at least 1 employee and 1 coverage requirement first.')
      return
    }

    if (activeSchedule && activeSchedule.assignments.length > 0) {
      setIsConfirmingGenerate(true)
      return
    }

    executeGenerate()
  }

  const executeGenerate = async () => {
    setIsGenerating(true)
    setProgress(0)
    setErrorStatus(null)

    const baseDate = new Date(`${targetStartDate}T00:00:00`)
    const actualStartMonday = getNextMonday(baseDate)
    const baseMs = actualStartMonday.getTime()

    const totalWeeks = 4
    const generatedShifts: Shift[] = []

    // Loop through every day in the generation window
    for (let dayOffset = 0; dayOffset < totalWeeks * 7; dayOffset++) {
      const d = new Date(baseMs + dayOffset * 24 * 60 * 60 * 1000)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

      const reqs = useCoverageStore.getState().getRequirementsForDate(dateStr)
      const weekNumber = Math.floor(dayOffset / 7)

      // dayOffset is 0-based from Monday.
      // Our DAY_MAP expects: Sunday=0, Monday=1, etc.
      const dayOfWeek = ((dayOffset % 7) + 1) % 7

      reqs.forEach((r) => {
        const shift = createShift({
          day:
            (Object.keys(DAY_MAP).find(
              (k) => DAY_MAP[k as keyof typeof DAY_MAP] === dayOfWeek,
            ) as DayOfWeek) || 'monday',
          startTime: r.startTime,
          endTime: r.endTime,
          requiredStaff: r.requiredStaff,
          weekNumber,
          role: r.role,
          unpaidBreakMinutes: r.unpaidBreakMinutes,
        })
        generatedShifts.push(shift)
      })
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
      let duration = endH > startH ? endH - startH : 24 - startH + endH

      if (s.unpaidBreakMinutes) {
        duration -= s.unpaidBreakMinutes / 60
      }

      for (let i = 0; i < s.requiredStaff; i++) {
        engineShifts.push({
          id: `${s.id}-${i}`,
          dayOfWeek: DAY_MAP[s.day] ?? 0,
          weekNumber: s.weekNumber ?? 0,
          start: s.startTime,
          end: s.endTime,
          role: s.role || 'any',
          durationHours: duration,
          isAssigned: false,
        })
      }
    })

    try {
      const result = await generateScheduleAsync(engineEmployees, engineShifts, (p) => {
        setProgress(Math.round(p))
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
        name: 'Standard Schedule',
        startDate: actualStartMonday.toISOString(),
        endDate: new Date(
          actualStartMonday.getTime() + totalWeeks * 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        shifts: generatedShifts,
        assignments: finalAssignments,
        qualityScore: result.success ? 100 : 0,
        unfilledShiftIds: result.unfilledShifts.map((s) => s.id),
      })

      setActiveSchedule(newSchedule)
      setActiveWeekNumber(0)
    } catch (err: unknown) {
      setErrorStatus(err instanceof Error ? err.message : 'Solver Engine Failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const totalWeeksInSchedule = activeSchedule
    ? Math.ceil(
        (new Date(activeSchedule.endDate).getTime() -
          new Date(activeSchedule.startDate).getTime()) /
          (7 * 24 * 60 * 60 * 1000),
      ) || 1
    : 1

  return (
    <div className="schedule-manager">
      <header className="sm-header">
        <div>
          <h2 className="sm-title">
            <CalendarDays size={20} color="var(--color-accent)" />
            Schedule Builder
          </h2>
          <p className="sm-subtitle">Generate staff schedules.</p>
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

              <div className="sm-secondary-actions">
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
              </div>

              <ShareToolbar
                state={{
                  employees,
                  coverageRequirements: requirements,
                  baselineRequirements: baselineRequirements,
                  schedule: activeSchedule,
                }}
                onImport={async (file) => {
                  try {
                    const text = await readFileAsText(file)
                    const imported = deserializeScheduleJSON(text)

                    // Wipe existing ecosystem to perform clean replacement
                    await covrdDb.purgeAll()
                    useEmployeeStore.getState().hydrate([])
                    useCoverageStore.getState().reset()
                    useScheduleStore.getState().hydrate([])
                    
                    imported.employees.forEach((e: Employee) => useEmployeeStore.getState().addEmployee(e))
                    imported.coverageRequirements.forEach((r: CoverageRequirement) =>
                      useCoverageStore.getState().addRequirement(r),
                    )
                    if (imported.baselineRequirements) {
                      imported.baselineRequirements.forEach((b: BaselineRequirement) =>
                        useCoverageStore.getState().addBaselineRequirement(b),
                      )
                    }

                    setActiveSchedule(imported.schedule)
                    setToastMessage('Successfully loaded data!')
                  } catch (err: unknown) {
                    setErrorStatus(err instanceof Error ? err.message : 'Failed to import JSON file')
                  }
                }}
              />
            </>
          )}

          <div className="sm-generate-zone">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <label
                htmlFor="sm-start-date"
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--color-text-muted)',
                  marginBottom: '0.1rem',
                  paddingLeft: '2px',
                }}
              >
                Start Week (Mon)
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  className="sm-btn-ghost"
                  style={{ padding: '0.2rem', marginRight: '0.25rem' }}
                  onClick={() => {
                    const d = new Date(`${targetStartDate}T00:00:00`)
                    d.setDate(d.getDate() - 7)
                    setTargetStartDate(
                      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
                    )
                  }}
                  title="Previous Week"
                >
                  <ChevronLeft size={16} />
                </button>
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
                      setTargetStartDate(
                        `${nextMon.getFullYear()}-${String(nextMon.getMonth() + 1).padStart(2, '0')}-${String(nextMon.getDate()).padStart(2, '0')}`,
                      )
                    } else {
                      setTargetStartDate(val)
                    }
                  }}
                  style={{
                    background: 'var(--color-bg-elevated)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    padding: '0.4rem 0.5rem',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.85rem',
                  }}
                />
                <button
                  className="sm-btn-ghost"
                  style={{ padding: '0.2rem', marginLeft: '0.25rem' }}
                  onClick={() => {
                    const d = new Date(`${targetStartDate}T00:00:00`)
                    d.setDate(d.getDate() + 7)
                    setTargetStartDate(
                      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
                    )
                  }}
                  title="Next Week"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <button
              className="sm-btn-generate"
              onClick={handleGenerateClick}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <RefreshCw size={16} className="lucide-spin" />
              ) : (
                <Sparkles size={28} />
              )}
              {isGenerating ? 'Solving...' : 'Automagic Schedule'}
            </button>
          </div>
        </div>
      </header>

      <div className="sm-content">
        {toastMessage && (
          <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} duration={4000} type="success" />
        )}
        
        {isConfirmingGenerate && (
          <div className="sm-overlay" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
            <div
              style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                maxWidth: 400,
                textAlign: 'center',
                boxShadow:
                  '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    padding: '1rem',
                    borderRadius: '50%',
                  }}
                >
                  <XCircle size={32} color="#ef4444" />
                </div>
              </div>
              <h3 style={{ color: 'var(--color-text-primary)', marginTop: 0 }}>
                Replace Schedule?
              </h3>
              <p
                style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}
              >
                This will overwrite your currently active schedule with a brand new mathematically
                optimized layout. Are you super sure you want to proceed?
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center',
                  marginTop: '2rem',
                }}
              >
                <button className="sm-btn-ghost" onClick={() => setIsConfirmingGenerate(false)}>
                  Cancel
                </button>
                <button
                  className="sm-btn-generate"
                  style={{ background: '#ef4444' }}
                  onClick={() => {
                    setIsConfirmingGenerate(false)
                    executeGenerate()
                  }}
                >
                  Yes, Replace It
                </button>
              </div>
            </div>
          </div>
        )}

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
          <div className="sm-grid-container sm-grid-layout">
            <div className="sm-info-bar">
              <div>
                <h3 style={{ color: 'var(--color-text-primary)', margin: 0 }}>
                  {activeSchedule.name.startsWith('Auto Generated')
                    ? 'Weekly Schedule'
                    : activeSchedule.name}
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

              <div className="sm-week-nav">
                <h4 style={{ margin: 0, color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
                  Week {activeWeekNumber + 1}{' '}
                  <span
                    style={{
                      opacity: 0.6,
                      fontSize: '0.9em',
                      marginLeft: '0.5rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    ({formatWeekRange(activeSchedule.startDate, activeWeekNumber)})
                  </span>
                </h4>

                {totalWeeksInSchedule > 1 && (
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      className="sm-btn-ghost"
                      onClick={() => setActiveWeekNumber(Math.max(0, activeWeekNumber - 1))}
                      disabled={activeWeekNumber <= 0}
                      title="Previous Week"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                        color: 'var(--color-text-muted)',
                        padding: '0 0.5rem',
                      }}
                    >
                      {activeWeekNumber + 1} of {totalWeeksInSchedule}
                    </span>
                    <button
                      className="sm-btn-ghost"
                      onClick={() =>
                        setActiveWeekNumber(
                          Math.min(totalWeeksInSchedule - 1, activeWeekNumber + 1),
                        )
                      }
                      disabled={activeWeekNumber >= totalWeeksInSchedule - 1}
                      title="Next Week"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
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

            <div className="scroll-matrix-wrapper" style={{ overflowY: 'auto' }}>
              <div className="weekly-block">
                {viewMode === 'matrix' ? (
                  <WeeklyGrid weekNumber={activeWeekNumber} startDate={activeSchedule.startDate} />
                ) : (
                  <TimelineGrid
                    weekNumber={activeWeekNumber}
                    startDate={activeSchedule.startDate}
                  />
                )}
              </div>
            </div>

            <div className="schedule-analytics">
              <CoverageHeatmap activeWeekNumber={activeWeekNumber} />
              <FairnessChart activeWeekNumber={activeWeekNumber} />
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
                onCtaClick={handleGenerateClick}
              />
            </div>
          )
        )}
      </div>
    </div>
  )
}
