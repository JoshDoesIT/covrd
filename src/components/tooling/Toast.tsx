import { useEffect } from 'react'
import './Toast.css'

/**
 * Toast notification props.
 */
interface ToastProps {
  /** Message text to display. */
  message: string
  /** Callback when the toast should be removed. */
  onDismiss: () => void
  /** Auto-dismiss duration in ms. Defaults to 3000. */
  duration?: number
}

/**
 * Toast — Lightweight notification that auto-dismisses.
 *
 * Displays a status message with a slide-in animation.
 * Auto-dismisses after the specified duration (default 3s).
 */
export function Toast({ message, onDismiss, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [onDismiss, duration])

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast__message">{message}</span>
    </div>
  )
}
