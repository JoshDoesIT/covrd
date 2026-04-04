import { useState, useMemo } from 'react'
import { Plus, Edit2, Trash2, X, Clock, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import Holidays from 'date-holidays'
import { useEmployeeStore } from '../../stores/employeeStore'
import { useCoverageStore } from '../../stores/coverageStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { createCoverageRequirement, createBaselineRequirement } from '../../types/factories'
import type { CoverageRequirement, BaselineRequirement } from '../../types/index'
import { formatTime } from '../../utils/formatTime'
import { EmptyState } from '../shared/EmptyState'
import './CoverageManager.css'

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  // Returns 0 for Sunday, 1 for Monday, etc.
  return new Date(year, month, 1).getDay()
}

export function CoverageManager() {
  const { requirements, baselineRequirements, addRequirement, updateRequirement, removeRequirement, addBaselineRequirement, updateBaselineRequirement, removeBaselineRequirement, getRequirementsForDate } = useCoverageStore()
  const { employees } = useEmployeeStore()
  const { timeFormat, holidayCountry, update } = useSettingsStore()

  // Extract unique roles from current active employees
  const availableRoles = useMemo(() => {
    const roles = new Set(employees.map(e => e.role).filter(Boolean))
    return Array.from(roles).sort()
  }, [employees])

  const [viewMode, setViewMode] = useState<'baseline' | 'calendar'>('baseline')
  const [activeBaselineDay, setActiveBaselineDay] = useState<number | null>(null) // 0(Mon)-6(Sun)
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activeDate, setActiveDate] = useState<string | null>(null) // YYYY-MM-DD
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Partial<CoverageRequirement | BaselineRequirement>>({})

  const hd = useMemo(() => new Holidays(holidayCountry || 'US'), [holidayCountry])
  const currentYear = currentDate.getFullYear()
  const holidays = useMemo(() => {
    return hd.getHolidays(currentYear).reduce((acc, h) => {
      const dateStr = h.date.split(' ')[0]
      if (!acc[dateStr]) acc[dateStr] = []
      acc[dateStr].push(h.name)
      return acc
    }, {} as Record<string, string[]>)
  }, [currentYear, hd])

  const activeReqs = viewMode === 'baseline' 
    ? (activeBaselineDay !== null ? baselineRequirements.filter(r => r.dayOfWeek === activeBaselineDay) : [])
    : (activeDate ? requirements.filter(r => r.date === activeDate) : [])

  const activeReq = useMemo(() => {
    if (isCreating) {
      if (viewMode === 'baseline') {
        return { ...createBaselineRequirement({ dayOfWeek: activeBaselineDay ?? 0, startTime: '09:00', endTime: '17:00', requiredStaff: 1 }), ...formData }
      } else {
        return { ...createCoverageRequirement({ date: activeDate || '', startTime: '09:00', endTime: '17:00', requiredStaff: 1 }), ...formData }
      }
    }
    if (editingId) {
      if (viewMode === 'baseline') {
        return { ...baselineRequirements.find((r) => r.id === editingId), ...formData }
      } else {
        return { ...requirements.find((r) => r.id === editingId), ...formData }
      }
    }
    return null
  }, [editingId, isCreating, requirements, baselineRequirements, formData, activeDate, activeBaselineDay, viewMode])

  const handleStartCreate = () => {
    setEditingId(null)
    setIsCreating(true)
    setFormData({
      startTime: '09:00',
      endTime: '17:00',
      requiredStaff: 2,
      role: '',
    })
  }

  const handleStartEdit = (e: React.MouseEvent, req: CoverageRequirement | BaselineRequirement) => {
    e.stopPropagation()
    setIsCreating(false)
    setEditingId(req.id)
    setFormData({
      startTime: req.startTime,
      endTime: req.endTime,
      requiredStaff: req.requiredStaff,
      role: req.role,
      unpaidBreakMinutes: req.unpaidBreakMinutes,
    })
  }

  const handleDelete = (e: React.MouseEvent, reqId: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to remove this requirement?')) {
      if (viewMode === 'baseline') {
        removeBaselineRequirement(reqId)
      } else {
        removeRequirement(reqId)
      }
      if (editingId === reqId) setEditingId(null)
    }
  }

  const handleSave = () => {
    if (viewMode === 'baseline') {
      if (activeBaselineDay === null) return alert('Day is required.')
      if (isCreating) {
        addBaselineRequirement(createBaselineRequirement({
          dayOfWeek: activeBaselineDay,
          startTime: formData.startTime ?? '09:00',
          endTime: formData.endTime ?? '17:00',
          requiredStaff: formData.requiredStaff ?? 1,
          role: formData.role || undefined,
          unpaidBreakMinutes: formData.unpaidBreakMinutes ?? 0
        }))
      } else if (editingId) {
        updateBaselineRequirement(editingId, formData)
      }
    } else {
      if (!activeDate) return alert('Date is required.')
      if (isCreating) {
        addRequirement(createCoverageRequirement({
          date: activeDate,
          startTime: formData.startTime ?? '09:00',
          endTime: formData.endTime ?? '17:00',
          requiredStaff: formData.requiredStaff ?? 1,
          role: formData.role || undefined,
          unpaidBreakMinutes: formData.unpaidBreakMinutes ?? 0
        }))
      } else if (editingId) {
        updateRequirement(editingId, formData as Partial<CoverageRequirement>)
      }
    }
    
    setIsCreating(false)
    setEditingId(null)
    setFormData({})
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingId(null)
    setFormData({})
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    setIsCreating(false)
    setEditingId(null)
    setActiveDate(null)
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    setIsCreating(false)
    setEditingId(null)
    setActiveDate(null)
  }

  const handleCurrentMonth = () => {
    setCurrentDate(new Date())
    setIsCreating(false)
    setEditingId(null)
    setActiveDate(null)
  }



  // Generate calendar days
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  // Ensure the calendar starts on Monday by shifting the offset
  const firstDayIndex = getFirstDayOfMonth(year, month) 
  // Native getDay: 0=Sun, 1=Mon, ..., 6=Sat
  // We want Monday=0, Sunday=6
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1

  const calendarDays = []
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null) // Empty days before 1st
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const isoStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    calendarDays.push(isoStr)
  }

  return (
    <div className="coverage-manager">
      <header className="cm-header">
        <div>
          <h2 className="cm-title">
            <Clock size={20} color="var(--color-accent)" />
            Coverage Canvas
          </h2>
          <p className="cm-subtitle">
            {viewMode === 'baseline' 
              ? 'Define your recurring weekly requirements.' 
              : 'Add exceptions for specific calendar dates.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="view-mode-toggle" style={{ display: 'flex', background: 'var(--color-bg-primary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <button 
              className={`action-btn ${viewMode === 'baseline' ? 'active-toggle' : ''}`}
              style={{ border: 'none', background: viewMode === 'baseline' ? 'var(--color-bg-surface)' : 'transparent', boxShadow: viewMode === 'baseline' ? 'var(--shadow-sm)' : 'none' }}
              onClick={() => {
                setViewMode('baseline')
                setEditingId(null)
                setIsCreating(false)
              }}>
              Baseline Template
            </button>
            <button 
              className={`action-btn ${viewMode === 'calendar' ? 'active-toggle' : ''}`}
              style={{ border: 'none', background: viewMode === 'calendar' ? 'var(--color-bg-surface)' : 'transparent', boxShadow: viewMode === 'calendar' ? 'var(--shadow-sm)' : 'none' }}
              onClick={() => {
                setViewMode('calendar')
                setEditingId(null)
                setIsCreating(false)
              }}>
              Calendar Exceptions
            </button>
          </div>
        </div>
      </header>

      <div className="cm-content">
        {viewMode === 'baseline' ? (
          <div className="cm-calendar-container">
            <div className="cm-calendar-grid" style={{ gridTemplateRows: 'auto 1fr' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="cm-calendar-col-header">{day}</div>
              ))}
              
              {[0,1,2,3,4,5,6].map(dow => {
                 const reqsCount = baselineRequirements.filter(r => r.dayOfWeek === dow).length
                 const isActive = activeBaselineDay === dow
                 
                 return (
                   <div key={`dow-${dow}`} className={`cm-calendar-cell ${isActive ? 'active' : ''}`}
                        onClick={() => { setActiveBaselineDay(isActive ? null : dow); setIsCreating(false); setEditingId(null) }}>
                      {reqsCount > 0 && <div className="cm-req-count">{reqsCount} shift{reqsCount === 1 ? '' : 's'}</div>}
                   </div>
                 )
              })}
            </div>
          </div>
        ) : (
        <div className="cm-calendar-container">
          <div className="cm-calendar-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button className="ec-btn-icon" onClick={handlePrevMonth}><ChevronLeft size={20} /></button>
              <h3 className="cm-calendar-title">
                {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </h3>
              <button className="ec-btn-icon" onClick={handleNextMonth}><ChevronRight size={20} /></button>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button className="action-btn" onClick={handleCurrentMonth} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                Today
              </button>
              <select className="form-input" style={{ width: 'auto', height: '30px', padding: '0 0.5rem', fontSize: '0.75rem' }} value={holidayCountry || 'US'} onChange={e => update({ holidayCountry: e.target.value })}>
                <option value="US">🇺🇸 United States</option>
                <option value="GB">🇬🇧 United Kingdom</option>
                <option value="CA">🇨🇦 Canada</option>
                <option value="AU">🇦🇺 Australia</option>
                <option value="NZ">🇳🇿 New Zealand</option>
                <option value="IN">🇮🇳 India</option>
                <option value="ZA">🇿🇦 South Africa</option>
                <option value="DE">🇩🇪 Germany</option>
                <option value="FR">🇫🇷 France</option>
                <option value="JP">🇯🇵 Japan</option>
                <option value="BR">🇧🇷 Brazil</option>
                <option value="MX">🇲🇽 Mexico</option>
              </select>
            </div>
          </div>
          
          <div className="cm-calendar-grid">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="cm-calendar-col-header">{day}</div>
            ))}
            {calendarDays.map((dateStr, idx) => {
              if (!dateStr) return <div key={`empty-${idx}`} className="cm-calendar-cell empty" />
              
              const dayOfMonth = dateStr.split('-')[2]
              const reqs = getRequirementsForDate(dateStr)
              const isHoliday = holidays[dateStr]
              const isActive = activeDate === dateStr

              return (
                <div 
                  key={dateStr} 
                  className={`cm-calendar-cell ${isActive ? 'active' : ''} ${isHoliday ? 'holiday' : ''}`}
                  onClick={() => {
                    setActiveDate(isActive ? null : dateStr)
                    setIsCreating(false)
                    setEditingId(null)
                  }}
                >
                  <span className="cm-cell-date">{dayOfMonth}</span>
                  {reqs.length > 0 && (
                    <div className="cm-req-count">{reqs.length} shift{reqs.length === 1 ? '' : 's'}</div>
                  )}
                  {isHoliday && (
                    <div className="cm-holiday-marker" title={holidays[dateStr].join(', ')} style={{ marginTop: '0.25rem' }}>
                      <Star size={10} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} />
                      <span className="cm-holiday-text" style={{ verticalAlign: 'middle' }}>{holidays[dateStr][0]}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        )}

        {/* Right Pane Editor */}
        {(viewMode === 'baseline' ? activeBaselineDay !== null : activeDate !== null) && (
          <div className={`cm-roster ${isCreating || editingId ? 'editing-mode' : ''}`}>
             <div className="cm-roster-header">
                <h3>Add Shifts for {viewMode === 'baseline' ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][activeBaselineDay!] : activeDate}</h3>
                {!isCreating && !editingId && (
                  <button className="cm-add-btn" onClick={handleStartCreate}>
                    <Plus size={16} /> Add 
                  </button>
                )}
             </div>

             {/* Roster List Map */}
             {!isCreating && !editingId && (
                activeReqs.length === 0 ? (
                  <EmptyState
                    title="No shifts identified"
                    description={`Define what you need for this day.`}
                    icon={<Clock size={32} opacity={0.5} />}
                  />
                ) : (
                  <div className="cm-roster-list">
                    {activeReqs.sort((a,b) => a.startTime.localeCompare(b.startTime)).map((req) => (
                      <div
                        key={req.id}
                        className="req-card"
                        onClick={(e) => handleStartEdit(e, req)}
                      >
                        <div className="rc-info">
                          <div className="rc-time">
                            <Clock size={12} /> {formatTime(req.startTime, timeFormat)} &rarr; {formatTime(req.endTime, timeFormat)}
                            {req.role && (
                              <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.4rem', background: 'var(--color-accent)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                                {req.role}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="rc-staff">
                          <div className="rc-staff-count" title="Required Staff">
                            {req.requiredStaff}
                            <span className="rc-staff-label">staff</span>
                          </div>
                          <div className="rc-actions">
                            <button className="ec-btn-icon" onClick={(e) => handleStartEdit(e, req)}>
                              <Edit2 size={14} />
                            </button>
                            <button className="ec-btn-icon danger" onClick={(e) => handleDelete(e, req.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
             )}

             {/* Editing pane content... */}
             {(isCreating || editingId) && activeReq && (
                <div className="cm-editor-inline">
                  <div className="editor-header">
                    <h3 className="editor-title">{isCreating ? 'New Shift' : 'Edit Shift'}</h3>
                    <button className="editor-close" onClick={handleCancel}>
                      <X size={18} />
                    </button>
                  </div>

                  <div className="editor-body">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Start Time</label>
                        <input
                          type="time"
                          className="form-input"
                          value={formData.startTime ?? '09:00'}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">End Time</label>
                        <input
                          type="time"
                          className="form-input"
                          value={formData.endTime ?? '17:00'}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Required Headcount</label>
                        <input
                          type="number"
                          className="form-input"
                          value={formData.requiredStaff ?? 1}
                          onChange={(e) => setFormData({ ...formData, requiredStaff: Number(e.target.value) })}
                          min={1}
                          max={100}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Unpaid Break</label>
                        <select
                          className="form-input"
                          value={formData.unpaidBreakMinutes ?? 0}
                          onChange={(e) => setFormData({ ...formData, unpaidBreakMinutes: Number(e.target.value) })}
                        >
                          <option value={0}>No Break</option>
                          <option value={15}>15 mins</option>
                          <option value={30}>30 mins</option>
                          <option value={45}>45 mins</option>
                          <option value={60}>1 hour</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Required Role</label>
                        <select
                          className="form-input"
                          value={formData.role ?? ''}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                          <option value="">Any Role</option>
                          {availableRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="editor-footer">
                    <button className="btn-secondary" onClick={handleCancel}>Cancel</button>
                    <button className="btn-primary" onClick={handleSave}>
                      {isCreating ? 'Add Shift' : 'Save Shift'}
                    </button>
                  </div>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  )
}
