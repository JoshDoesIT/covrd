import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useEmployeeStore } from '../../stores/employeeStore'
import { useCoverageStore } from '../../stores/coverageStore'
import { useScheduleStore } from '../../stores/scheduleStore'
import { useTemplateStore } from '../../stores/templateStore'
import { covrdDb } from '../../db/db'
import './DataPurge.css'

/**
 * DataPurge — Destructive confirmation dialog for clearing all user data.
 *
 * Requires the user to type "DELETE" to enable the purge button.
 * Clears all Zustand stores, IndexedDB (Dexie), and localStorage.
 */
interface DataPurgeProps {
  onClose: () => void
}

export function DataPurge({ onClose }: DataPurgeProps) {
  const [confirmation, setConfirmation] = useState('')
  const [isPurging, setIsPurging] = useState(false)

  const isConfirmed = confirmation === 'DELETE'

  const handlePurge = async () => {
    if (!isConfirmed) return
    setIsPurging(true)

    // Clear all Zustand stores
    useEmployeeStore.getState().reset()
    useCoverageStore.getState().reset()
    useScheduleStore.getState().reset()
    useTemplateStore.getState().reset()

    // Clear Dexie IndexedDB
    await covrdDb.purgeAll()

    // Clear localStorage
    localStorage.clear()

    setIsPurging(false)
    onClose()
  }

  return (
    <div className="data-purge__overlay">
      <div className="data-purge__modal" role="dialog" aria-labelledby="purge-title">
        <div className="data-purge__icon">
          <AlertTriangle size={40} color="var(--color-danger)" />
        </div>

        <h2 id="purge-title" className="data-purge__title">
          Purge All Data
        </h2>

        <p className="data-purge__warning">
          This action <strong>cannot be undone</strong>. All employees, coverage requirements,
          schedules, templates, and settings will be permanently deleted from this browser.
        </p>

        <div className="data-purge__confirm-field">
          <label className="data-purge__label" htmlFor="purge-input">
            Type <code>DELETE</code> to confirm:
          </label>
          <input
            id="purge-input"
            className="data-purge__input"
            type="text"
            placeholder="Type DELETE to confirm"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="data-purge__actions">
          <button
            className="data-purge__btn data-purge__btn--cancel"
            onClick={onClose}
            aria-label="Cancel"
          >
            Cancel
          </button>
          <button
            className="data-purge__btn data-purge__btn--danger"
            onClick={handlePurge}
            disabled={!isConfirmed || isPurging}
            aria-label="Confirm Purge"
          >
            {isPurging ? 'Purging...' : 'Confirm Purge'}
          </button>
        </div>
      </div>
    </div>
  )
}
