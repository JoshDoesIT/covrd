import { describe, test, expect, beforeEach } from 'vitest'
import { auditPrivacy } from './privacyAudit'

describe('Privacy Audit', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('returns a valid audit report structure', () => {
    const report = auditPrivacy()
    expect(report).toHaveProperty('localStorageKeys')
    expect(report).toHaveProperty('localStorageBytes')
    expect(report).toHaveProperty('indexedDBDatabases')
    expect(report).toHaveProperty('cookieCount')
    expect(report).toHaveProperty('timestamp')
  })

  test('detects localStorage entries', () => {
    localStorage.setItem('test-key', 'test-value')
    const report = auditPrivacy()
    expect(report.localStorageKeys).toContain('test-key')
    expect(report.localStorageBytes).toBeGreaterThan(0)
  })

  test('reports zero cookies in test environment', () => {
    const report = auditPrivacy()
    expect(report.cookieCount).toBe(0)
  })

  test('timestamp is a valid ISO string', () => {
    const report = auditPrivacy()
    expect(() => new Date(report.timestamp)).not.toThrow()
    expect(new Date(report.timestamp).toISOString()).toBe(report.timestamp)
  })

  test('formatReport returns a formatted string', () => {
    const report = auditPrivacy()
    expect(report.formatted).toContain('Covrd Privacy Audit')
    expect(typeof report.formatted).toBe('string')
  })
})
