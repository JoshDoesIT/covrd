import { useState, useRef } from 'react'
import { Download, Upload, Printer, Link2, QrCode } from 'lucide-react'
import type { ShareableState } from '../../stores/urlState'
import { generateShareUrl } from '../../stores/urlState'
import {
  serializeScheduleJSON,
  serializeScheduleCSV,
  downloadFile,
} from '../../utils/exportSchedule'
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
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showQr, setShowQr] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    window.print()
  }

  const handleShareLink = async () => {
    const url = generateShareUrl(state)
    try {
      await navigator.clipboard.writeText(url)
      setToastMessage('Link copied to clipboard!')
    } catch {
      setToastMessage('Failed to copy link')
    }
  }

  const handleQrCode = async () => {
    try {
      setToastMessage('Generating optimized QR code...')
      
      const QRCodeModule = await import('qrcode')
      const QRCode = QRCodeModule.default || QRCodeModule
      const url = generateShareUrl(state)
      
      let finalUrl = url
      try {
        // Attempt to shorten the long state URL via is.gd (Free, CORS-friendly, no-auth)
        // This ensures the QR code is physically scannable and doesn't exceed 2.9KB limits
        const res = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`)
        const data = await res.json()
        if (data.shorturl) {
          finalUrl = data.shorturl
        }
      } catch (e) {
        console.warn('URL shortener failed or offline. Falling back to native size.', e)
      }

      // Use lowest error correction ('L') to maximize remaining capacity for fallbacks
      const dataUrl = await QRCode.toDataURL(finalUrl, { 
        width: 256, 
        margin: 2,
        errorCorrectionLevel: 'L' 
      })
      
      setToastMessage(null) // Clear loading toast
      setQrDataUrl(dataUrl)
      setShowQr(true)
    } catch (error: any) {
      console.error('QR Code Generation Error:', error)
      if (error?.message?.includes('too big')) {
        setToastMessage('Schedule still too massive for QR. Use Share Link or Export instead.')
      } else {
        setToastMessage('Failed to generate QR code')
      }
    }
  }

  return (
    <div className="share-toolbar">
      <button
        className="sm-btn-ghost share-toolbar__btn"
        onClick={handleExportJSON}
        aria-label="Export JSON"
        title="Export schedule as JSON"
      >
        <Download size={14} />
        <span className="share-toolbar__label">Export JSON</span>
      </button>

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
        onClick={handleImportClick}
        aria-label="Import"
        title="Import schedule from JSON"
      >
        <Upload size={14} />
        <span className="share-toolbar__label">Import</span>
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

      <button
        className="sm-btn-ghost share-toolbar__btn"
        onClick={handleQrCode}
        aria-label="QR Code"
        title="Generate QR code"
      >
        <QrCode size={14} />
        <span className="share-toolbar__label">QR Code</span>
      </button>

      {showQr && qrDataUrl && (
        <div className="share-toolbar__qr-overlay" onClick={() => setShowQr(false)}>
          <div className="share-toolbar__qr-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="share-toolbar__qr-title">Scan to open schedule</h3>
            <img src={qrDataUrl} alt="QR code for schedule URL" className="share-toolbar__qr-img" />
            <button className="sm-btn-ghost" onClick={() => setShowQr(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}
    </div>
  )
}
