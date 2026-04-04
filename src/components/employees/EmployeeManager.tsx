import { useState, useMemo } from 'react'
import { Plus, Users, Edit2, Trash2, X, AlertCircle } from 'lucide-react'
import { useEmployeeStore } from '../../stores/employeeStore'
import { createEmployee } from '../../types/factories'
import type { Employee } from '../../types/index'
import { AvailabilityGrid } from './AvailabilityGrid'
import { EmptyState } from '../shared/EmptyState'
import { Modal } from '../shared/Modal'
import { Toast } from '../tooling/Toast'
import './EmployeeManager.css'

export function EmployeeManager() {
  const { employees, addEmployee, removeEmployee, updateEmployee } = useEmployeeStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isManagingAvail, setIsManagingAvail] = useState(false)
  const [formData, setFormData] = useState<Partial<Employee>>({})
  const [empToDelete, setEmpToDelete] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{
    text: string
    type: 'default' | 'success'
  } | null>(null)

  // Determine which employee or new employee is actively shown in the right pane
  const activeEmployee = useMemo(() => {
    if (isCreating)
      return { ...createEmployee({ name: 'New Employee', role: 'Staff' }), ...formData }
    if (editingId) return { ...employees.find((e) => e.id === editingId), ...formData } as Employee
    return null
  }, [editingId, isCreating, employees, formData])

  const handleStartCreate = () => {
    setEditingId(null)
    setIsCreating(true)
    setIsManagingAvail(false)
    setFormData({
      name: '',
      role: 'staff',
      employmentType: 'full-time',
      maxHoursPerWeek: 40,
      minHoursPerWeek: 0,
    })
  }

  const handleStartEdit = (e: React.MouseEvent, emp: Employee) => {
    e.stopPropagation()
    setIsCreating(false)
    setIsManagingAvail(false)
    setEditingId(emp.id)
    setFormData({
      name: emp.name,
      role: emp.role,
      employmentType: emp.employmentType,
      maxHoursPerWeek: emp.maxHoursPerWeek,
      minHoursPerWeek: emp.minHoursPerWeek,
    })
  }

  const handleDeletePrompt = (e: React.MouseEvent, empId: string) => {
    e.stopPropagation()
    setEmpToDelete(empId)
  }

  const confirmDelete = () => {
    if (!empToDelete) return
    removeEmployee(empToDelete)
    if (editingId === empToDelete) {
      setEditingId(null)
      setIsManagingAvail(false)
    }
    setEmpToDelete(null)
  }

  const handleSave = () => {
    if (!formData.name) {
      setToastMessage({ text: 'Name is required.', type: 'default' })
      return
    }

    if (isCreating) {
      const newEmp = createEmployee({ name: formData.name!, role: formData.role ?? 'staff' })
      addEmployee({
        ...newEmp,
        role: formData.role ?? 'staff',
        employmentType: formData.employmentType ?? 'full-time',
        maxHoursPerWeek: formData.maxHoursPerWeek ?? 40,
        minHoursPerWeek: formData.minHoursPerWeek ?? 0,
      })
    } else if (editingId) {
      updateEmployee(editingId, formData)
    }

    setIsCreating(false)
    setEditingId(null)
    setFormData({})
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingId(null)
    setIsManagingAvail(false)
    setFormData({})
  }

  return (
    <div className="employee-manager">
      <header className="em-header">
        <div>
          <h2 className="em-title">
            <Users size={20} color="var(--color-accent)" />
            Team Roster
          </h2>
          <p className="em-subtitle">
            Manage your staff details, target hours, and base constraints.
          </p>
        </div>
        <button className="em-add-btn" onClick={handleStartCreate}>
          <Plus size={16} /> Add Employee
        </button>
      </header>

      <div className="em-content">
        <div className="em-roster">
          {employees.length === 0 ? (
            <div style={{ margin: '2rem 1rem' }}>
              <EmptyState
                title="No employees configured yet"
                description="Get started by adding your first team member to the roster."
                icon={<Users size={32} opacity={0.5} />}
                ctaLabel="Create Employee"
                onCtaClick={handleStartCreate}
              />
            </div>
          ) : (
            employees.map((emp) => (
              <div
                key={emp.id}
                className="employee-card"
                data-active={editingId === emp.id || undefined}
                onClick={(e) => handleStartEdit(e, emp)}
              >
                <div className="ec-header">
                  <div className="ec-identity">
                    <div className="ec-avatar" style={{ borderColor: emp.color, color: emp.color }}>
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="ec-name">{emp.name}</h3>
                      <p className="ec-role">{emp.role}</p>
                    </div>
                  </div>
                  <div className="ec-header-right">
                    <span className="ec-badge" data-type={emp.employmentType}>
                      {emp.employmentType}
                    </span>
                    <div className="ec-actions">
                      <button
                        className="ec-btn-icon"
                        onClick={(e) => handleStartEdit(e, emp)}
                        title="Edit Employee"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="ec-btn-icon danger"
                        onClick={(e) => handleDeletePrompt(e, emp.id)}
                        title="Remove Employee"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="ec-stats">
                  <div className="ec-stat">
                    <span className="ec-stat-val">{emp.maxHoursPerWeek}h</span>
                    <span className="ec-stat-lbl">Max/Wk</span>
                  </div>
                  <div className="ec-stat">
                    <span className="ec-stat-val">{emp.restrictions.length}</span>
                    <span className="ec-stat-lbl">Constraints</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Pane Editor */}
        {isManagingAvail && editingId ? (
          <div className="em-editor" style={{ padding: '1.25rem' }}>
            <AvailabilityGrid employeeId={editingId} onClose={() => setIsManagingAvail(false)} />
          </div>
        ) : (isCreating || editingId) && activeEmployee ? (
          <div className="em-editor">
            <div className="editor-header">
              <h3 className="editor-title">{isCreating ? 'New Employee' : 'Edit Profile'}</h3>
              <button className="editor-close" onClick={handleCancel}>
                <X size={18} />
              </button>
            </div>

            <div className="editor-body">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name ?? ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.role ?? ''}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Manager"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    className="form-input"
                    value={formData.employmentType ?? 'full-time'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employmentType: e.target.value as 'full-time' | 'part-time',
                      })
                    }
                  >
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Min Hours / wk</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.minHoursPerWeek ?? 0}
                    onChange={(e) =>
                      setFormData({ ...formData, minHoursPerWeek: Number(e.target.value) })
                    }
                    min={0}
                    max={168}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Hours / wk</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.maxHoursPerWeek ?? 40}
                    onChange={(e) =>
                      setFormData({ ...formData, maxHoursPerWeek: Number(e.target.value) })
                    }
                    min={1}
                    max={168}
                  />
                </div>
              </div>

              {!isCreating && (
                <div
                  className="form-group"
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                      color: 'var(--text-base)',
                    }}
                  >
                    <AlertCircle size={16} />{' '}
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      Advanced Constraints
                    </span>
                  </div>
                  <p
                    style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}
                  >
                    Set which days and hours this employee is available, plus any scheduling
                    restrictions.
                  </p>
                  <button
                    className="btn-secondary"
                    style={{
                      width: '100%',
                      borderColor: 'var(--primary)',
                      color: 'var(--primary)',
                    }}
                    onClick={() => setIsManagingAvail(true)}
                  >
                    Open Availability Matrix
                  </button>
                </div>
              )}
            </div>

            <div className="editor-footer">
              <button className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSave}>
                {isCreating ? 'Create Employee' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <Modal isOpen={!!empToDelete} onClose={() => setEmpToDelete(null)} title="Delete Employee">
        <p
          style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}
        >
          Are you sure you want to completely remove this employee from the roster? This will impact
          any generated schedules they are mapped to.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={() => setEmpToDelete(null)}>
            Cancel
          </button>
          <button
            className="btn-primary danger"
            onClick={confirmDelete}
            style={{ background: 'var(--color-danger)', color: 'white' }}
          >
            Yes, Remove Employee
          </button>
        </div>
      </Modal>

      {toastMessage && (
        <Toast
          message={toastMessage.text}
          type={toastMessage.type}
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </div>
  )
}
