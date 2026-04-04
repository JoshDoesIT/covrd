import { useState, useRef } from 'react'
import { Download, Upload, Printer, Link2 } from 'lucide-react'
import type { ShareableState } from '../../stores/urlState'
import { generateShareUrl } from '../../stores/urlState'
import { useScheduleStore } from '../../stores/scheduleStore'
import { useEmployeeStore } from '../../stores/employeeStore'
import { useSettingsStore } from '../../stores/settingsStore'
import {
  serializeScheduleJSON,
  serializeScheduleCSV,
  downloadFile,
} from '../../utils/exportSchedule'
import { printSchedule } from '../../utils/printSchedule'
import { Toast } from '../tooling/Toast'
import './ShareToolbar.css'

/**
 * ShareToolbar props.
 */
interface ShareToolbarProps {
  /** The current shareable state (schedule + employees + coverage). */
  state: ShareableState
  /** Optional callback when a file is imported. */
  onImport?: (file: File) => void
}

/**
 * ShareToolbar — Export, import, print, share, and QR actions.
 *
 * Renders inline with the ScheduleManager header when a schedule is active.
 */
export function ShareToolbar({ state, onImport }: ShareToolbarProps) {
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'default' | 'success'} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { activeSchedule } = useScheduleStore()
  const { employees } = useEmployeeStore()
  const { timeFormat } = useSettingsStore()

  const handleExportJSON = () => {
    const json = serializeScheduleJSON(state)
    downloadFile(json, 'covrd-schedule.json', 'application/json')
  }

  const handleExportCSV = () => {
    const csv = serializeScheduleCSV(state)
    downloadFile(csv, 'covrd-schedule.csv', 'text/csv')
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onImport) {
      onImport(file)
    }
    // Reset so the same file can be re-imported
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePrint = () => {
    try {
      if (activeSchedule) {
        printSchedule(activeSchedule, employees, timeFormat)
      } else {
        window.print()
      }
    } catch (err: unknown) {
      if (err instanceof Error) setToastMessage({ text: err.message, type: 'default' })
    }
  }

  const handleShareLink = async () => {
    const url = generateShareUrl(state)
    try {
      await navigator.clipboard.writeText(url)
      setToastMessage({ text: 'Link copied to clipboard!', type: 'success' })
    } catch {
      setToastMessage({ text: 'Failed to copy link', type: 'default' })
    }
  }

  return (
    <div className="share-toolbar">
      {/* Top Row */}
      <div className="share-toolbar__row share-toolbar__row--top">
        <button
          className="sm-btn-ghost share-toolbar__btn"
          onClick={handleImportClick}
          aria-label="Import JSON"
          title="Import schedule from JSON"
        >
          <Upload size={14} />
          <span className="share-toolbar__label">Import JSON</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-hidden="true"
        />

        <button
          className="sm-btn-ghost share-toolbar__btn"
          onClick={handleExportJSON}
          aria-label="Export JSON"
          title="Export schedule as JSON"
        >
          <Download size={14} />
          <span className="share-toolbar__label">Export JSON</span>
        </button>
      </div>

      {/* Bottom Row */}
      <div className="share-toolbar__row">
        <button
          className="sm-btn-ghost share-toolbar__btn"
          onClick={handleExportCSV}
          aria-label="Export CSV"
          title="Export schedule as CSV"
        >
          <Download size={14} />
          <span className="share-toolbar__label">Export CSV</span>
        </button>

        <button
          className="sm-btn-ghost share-toolbar__btn"
          onClick={handlePrint}
          aria-label="Print"
          title="Print schedule"
        >
          <Printer size={14} />
          <span className="share-toolbar__label">Print</span>
        </button>

        <button
          className="sm-btn-ghost share-toolbar__btn"
          onClick={handleShareLink}
          aria-label="Share Link"
          title="Copy share link to clipboard"
        >
          <Link2 size={14} />
          <span className="share-toolbar__label">Share Link</span>
        </button>
      </div>

      {toastMessage && <Toast message={toastMessage.text} type={toastMessage.type} onDismiss={() => setToastMessage(null)} />}
    </div>
  )
}
