import type { Employee } from '../types/index'

/**
 * Current roster export format version.
 */
const EXPORT_VERSION = 1

/**
 * Serialize an employee roster to JSON with metadata.
 *
 * @param employees - The employee array to export
 * @returns JSON string ready for file download
 */
export function serializeRosterJSON(employees: Employee[]): string {
  return JSON.stringify({
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    employees,
  })
}

/**
 * Deserialize and validate a JSON string into an Employee array.
 * All input is treated as untrusted.
 *
 * @param json - Raw JSON string from file upload
 * @returns Validated Employee array
 * @throws Error if JSON is invalid or employees field is missing/malformed
 */
export function deserializeRosterJSON(json: string): Employee[] {
  const parsed = JSON.parse(json)

  if (!parsed.employees || !Array.isArray(parsed.employees)) {
    throw new Error('Invalid roster file: employees must be an array')
  }

  return parsed.employees
}
