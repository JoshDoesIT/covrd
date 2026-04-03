import type { RecurringTemplate } from '../types/index'

/**
 * Current template export format version.
 */
const EXPORT_VERSION = 1

/**
 * Serialize a templates array to JSON with metadata.
 *
 * @param templates - The template array to export
 * @returns JSON string ready for file download
 */
export function serializeTemplatesJSON(templates: RecurringTemplate[]): string {
  return JSON.stringify({
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    templates,
  })
}

/**
 * Deserialize and validate a JSON string into a RecurringTemplate array.
 * All input is treated as untrusted.
 *
 * @param json - Raw JSON string from file upload
 * @returns Validated template array
 * @throws Error if JSON is invalid or templates field is missing/malformed
 */
export function deserializeTemplatesJSON(json: string): RecurringTemplate[] {
  const parsed = JSON.parse(json)

  if (!parsed.templates || !Array.isArray(parsed.templates)) {
    throw new Error('Invalid templates file: templates must be an array')
  }

  return parsed.templates
}
