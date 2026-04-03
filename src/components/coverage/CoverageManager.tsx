import { useState, useMemo } from 'react'
import { Plus, Edit2, Trash2, X, Clock, LayoutTemplate } from 'lucide-react'
import { useEmployeeStore } from '../../stores/employeeStore'
import { useCoverageStore } from '../../stores/coverageStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { createCoverageRequirement } from '../../types/factories'
import { DAYS_OF_WEEK } from '../../types/index'
import type { DayOfWeek, CoverageRequirement } from '../../types/index'
import { formatTime } from '../../utils/formatTime'
import { EmptyState } from '../shared/EmptyState'
import './CoverageManager.css'

export function CoverageManager() {
  const { requirements, addRequirement, updateRequirement, removeRequirement, getRequirementsForDay } = useCoverageStore()
  const { employees } = useEmployeeStore()
  const { timeFormat } = useSettingsStore()

  // Extract unique roles from current active employees
  const availableRoles = useMemo(() => {
    const roles = new Set(employees.map(e => e.role).filter(Boolean))
    return Array.from(roles).sort()
  }, [employees])
  const [activeDay, setActiveDay] = useState<DayOfWeek>('monday')
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Partial<CoverageRequirement>>({})

  const requirementsForDay = getRequirementsForDay(activeDay)

  const activeReq = useMemo(() => {
    if (isCreating) return { ...createCoverageRequirement({ name: 'New Req', day: activeDay, startTime: '09:00', endTime: '17:00', requiredStaff: 1 }), ...formData }
    if (editingId) return { ...requirements.find((r) => r.id === editingId), ...formData } as CoverageRequirement
    return null
  }, [editingId, isCreating, requirements, formData, activeDay])

  const handleStartCreate = () => {
    setEditingId(null)
    setIsCreating(true)
    setFormData({
      name: '',
      day: activeDay,
      startTime: '09:00',
      endTime: '17:00',
      requiredStaff: 2,
      role: '',
    })
  }

  const handleStartEdit = (e: React.MouseEvent, req: CoverageRequirement) => {
    e.stopPropagation()
    setIsCreating(false)
    setEditingId(req.id)
    setFormData({
      name: req.name,
      day: req.day,
      startTime: req.startTime,
      endTime: req.endTime,
      requiredStaff: req.requiredStaff,
      role: req.role,
    })
  }

  const handleDelete = (e: React.MouseEvent, reqId: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to remove this coverage requirement?')) {
      removeRequirement(reqId)
      if (editingId === reqId) setEditingId(null)
    }
  }

  const handleSave = () => {
    if (!formData.name) return alert('Name is required.')
    
    if (isCreating) {
      const newReq = createCoverageRequirement({
        name: formData.name,
        day: formData.day ?? activeDay,
        startTime: formData.startTime ?? '09:00',
        endTime: formData.endTime ?? '17:00',
        requiredStaff: formData.requiredStaff ?? 1,
        role: formData.role || undefined,
      })
      addRequirement(newReq)
    } else if (editingId) {
      updateRequirement(editingId, formData)
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

  return (
    <div className="coverage-manager">
      <header className="cm-header">
        <div>
          <h2 className="cm-title">Coverage Requirements</h2>
          <p className="cm-subtitle">Define the minimum threshold of required staff per time block.</p>
        </div>
        <button className="cm-add-btn" onClick={handleStartCreate}>
          <Plus size={16} /> Add Requirement
        </button>
      </header>

      <div className="cm-content">
        <div className="cm-days-sidebar">
          {DAYS_OF_WEEK.map((day) => {
            const count = requirements.filter(r => r.day === day).length
            return (
              <button 
                key={day} 
                className="cm-day-btn" 
                data-active={activeDay === day}
                onClick={() => {
                  setActiveDay(day)
                  setIsCreating(false)
                  setEditingId(null)
                }}
              >
                <span style={{ textTransform: 'capitalize' }}>{day}</span>
                <span className="cm-day-badge">{count}</span>
              </button>
            )
          })}
        </div>

        <div className="cm-roster">
          {requirementsForDay.length === 0 ? (
            <div style={{ margin: '2rem 1rem' }}>
              <EmptyState
                title="No coverage requirements"
                description={`You have not defined any requirements for ${activeDay}.`}
                icon={<LayoutTemplate size={32} opacity={0.5} />}
                ctaLabel="Add Requirement"
                onCtaClick={handleStartCreate}
              />
            </div>
          ) : (
            requirementsForDay.sort((a,b) => a.startTime.localeCompare(b.startTime)).map((req) => (
              <div
                key={req.id}
                className="req-card"
                onClick={(e) => handleStartEdit(e, req)}
              >
                <div className="rc-info">
                  <h3 className="rc-name">{req.name}</h3>
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
            ))
          )}
        </div>

        {/* Right Pane Editor */}
        {(isCreating || editingId) && activeReq && (
          <div className="cm-editor">
            <div className="editor-header">
              <h3 className="editor-title">{isCreating ? 'New Requirement' : 'Edit Requirement'}</h3>
              <button className="editor-close" onClick={handleCancel}>
                <X size={18} />
              </button>
            </div>

            <div className="editor-body">
              <div className="form-group">
                <label className="form-label">Requirement Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name ?? ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Morning Shift"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Day</label>
                <select
                  className="form-input"
                  value={formData.day ?? activeDay}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value as DayOfWeek })}
                  style={{ textTransform: 'capitalize' }}
                >
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

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
                {isCreating ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
