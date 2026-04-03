import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { auditPrivacy } from './utils/privacyAudit'

/**
 * Register the privacy audit on the global window object.
 * Developers can run `covrd.audit()` in the browser console
 * to inspect all client-side data storage.
 */
declare global {
  interface Window {
    covrd: { audit: typeof auditPrivacy }
  }
}

window.covrd = {
  audit: () => {
    const report = auditPrivacy()
    console.log(report.formatted)
    return report
  },
}

/**
 * Register the service worker for PWA offline support.
 * Only in production — dev server handles its own HMR.
 */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed — app continues without offline support
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
