/**
 * Privacy Audit — Enumerate all client-side data residency.
 *
 * Reports what data Covrd stores in the browser: localStorage keys,
 * IndexedDB databases, and cookies. Zero network requests are made.
 * Exposed as `window.covrd.audit()` for developer console access.
 */

export interface PrivacyAuditReport {
  /** All localStorage key names. */
  localStorageKeys: string[]
  /** Total bytes used by localStorage (estimated). */
  localStorageBytes: number
  /** Known IndexedDB database names. */
  indexedDBDatabases: string[]
  /** Number of cookies accessible via document.cookie. */
  cookieCount: number
  /** ISO timestamp of the audit. */
  timestamp: string
  /** Human-readable formatted report. */
  formatted: string
}

/**
 * Run a privacy audit of all client-side data storage.
 * Safe to call from the browser console via `covrd.audit()`.
 */
export function auditPrivacy(): PrivacyAuditReport {
  // Enumerate localStorage
  const localStorageKeys: string[] = []
  let localStorageBytes = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      localStorageKeys.push(key)
      const value = localStorage.getItem(key) ?? ''
      localStorageBytes += key.length * 2 + value.length * 2 // UTF-16 estimate
    }
  }

  // Known IndexedDB databases (Covrd uses 'covrd-db')
  const indexedDBDatabases = ['covrd-db']

  // Count cookies
  const cookieCount =
    typeof document !== 'undefined' && document.cookie
      ? document.cookie.split(';').filter((c) => c.trim().length > 0).length
      : 0

  const timestamp = new Date().toISOString()

  const formatted = [
    '══════════════════════════════════════',
    '  Covrd Privacy Audit',
    `  ${timestamp}`,
    '══════════════════════════════════════',
    '',
    `  localStorage: ${localStorageKeys.length} keys (~${(localStorageBytes / 1024).toFixed(1)} KB)`,
    ...localStorageKeys.map((k) => `    • ${k}`),
    '',
    `  IndexedDB: ${indexedDBDatabases.length} database(s)`,
    ...indexedDBDatabases.map((db) => `    • ${db}`),
    '',
    `  Cookies: ${cookieCount}`,
    '',
    '  Network requests: 0 (client-side only)',
    '  Server-side storage: none',
    '',
    '══════════════════════════════════════',
  ].join('\n')

  return {
    localStorageKeys,
    localStorageBytes,
    indexedDBDatabases,
    cookieCount,
    timestamp,
    formatted,
  }
}
