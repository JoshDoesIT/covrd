import pako from 'pako'
import type { Employee, CoverageRequirement, Schedule } from '../types/index'

/**
 * Shareable state payload — the data that gets encoded into URL hash fragments.
 * This is the complete state needed to reconstruct a schedule view.
 */
export interface ShareableState {
  employees: Employee[]
  coverageRequirements: CoverageRequirement[]
  schedule: Schedule
}

/**
 * Encode application state into a URL-safe hash string.
 *
 * Pipeline: JSON → pako deflate → Base64 (URL-safe)
 *
 * The hash fragment (`#`) is never sent to the server in HTTP requests,
 * ensuring zero server-side data exposure.
 *
 * @param state - The application state to encode
 * @returns URL-safe Base64 string
 */
export function encodeStateToHash(state: ShareableState): string {
  const json = JSON.stringify(state)
  const compressed = pako.deflate(json)
  const base64 = uint8ToBase64Url(compressed)
  return base64
}

/**
 * Decode application state from a URL hash string.
 *
 * Pipeline: Base64 (URL-safe) → pako inflate → JSON parse
 *
 * Returns null if the hash is invalid, corrupted, or cannot be parsed.
 * All input from URLs is treated as untrusted.
 *
 * @param hash - URL-safe Base64 string from hash fragment
 * @returns Decoded state, or null if invalid
 */
export function decodeStateFromHash(hash: string): ShareableState | null {
  if (!hash || hash.length === 0) return null

  try {
    const compressed = base64UrlToUint8(hash)
    const json = pako.inflate(compressed, { to: 'string' })
    const parsed = JSON.parse(json) as ShareableState

    // Basic structural validation — don't trust URL input
    if (!parsed.employees || !Array.isArray(parsed.employees)) return null
    if (!parsed.coverageRequirements || !Array.isArray(parsed.coverageRequirements)) return null
    if (!parsed.schedule || typeof parsed.schedule !== 'object') return null

    return parsed
  } catch {
    return null
  }
}

/**
 * Convert a Uint8Array to a URL-safe Base64 string.
 * Replaces `+` with `-`, `/` with `_`, and strips `=` padding.
 */
function uint8ToBase64Url(data: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Convert a URL-safe Base64 string back to a Uint8Array.
 * Restores standard Base64 characters and padding before decoding.
 */
function base64UrlToUint8(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  // Restore padding
  while (base64.length % 4 !== 0) {
    base64 += '='
  }
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Generate a full shareable URL with the encoded state in the hash fragment.
 *
 * The hash fragment (`#`) is never sent to the server in HTTP requests,
 * ensuring zero server-side data exposure.
 *
 * @param state - The application state to encode
 * @returns Full URL with hash fragment
 */
export function generateShareUrl(state: ShareableState): string {
  const hash = encodeStateToHash(state)
  const origin =
    typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''
  return `${origin}#${hash}`
}

/**
 * Attempt to hydrate application state from the current URL hash fragment.
 *
 * Returns null if no hash is present or if the hash is invalid.
 * All input from URLs is treated as untrusted.
 *
 * @returns Decoded state, or null if no valid hash is present
 */
export function hydrateFromHash(): ShareableState | null {
  if (typeof window === 'undefined') return null

  const hash = window.location.hash.replace(/^#/, '')
  if (!hash) return null

  return decodeStateFromHash(hash)
}

/**
 * Estimate the byte size of a share URL for the given state.
 * Used to verify that URLs stay within browser limits (~8KB).
 *
 * @param state - The application state to measure
 * @returns Estimated URL size in bytes
 */
export function estimateUrlSize(state: ShareableState): number {
  const hash = encodeStateToHash(state)
  // Approximate: origin + '#' + hash, measured in UTF-8 bytes
  return new TextEncoder().encode(hash).length
}
