import type { ShareableState } from '../stores/urlState'

/**
 * Current export format version.
 * Increment when making breaking changes to the schema.
 */
const EXPORT_VERSION = 1

/**
 * Serialize schedule state to a JSON string with metadata.
 * Includes version and timestamp for forward compatibility.
 *
 * @param state - The shareable state payload
 * @returns JSON string ready for file download
 */
export function serializeScheduleJSON(state: ShareableState): string {
  return JSON.stringify({
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    employees: state.employees,
    coverageRequirements: state.coverageRequirements,
    schedule: state.schedule,
  })
}

/**
 * Deserialize and validate a JSON string into ShareableState.
 * All input is treated as untrusted — structural validation is enforced.
 *
 * @param json - Raw JSON string from file upload
 * @returns Validated ShareableState
 * @throws Error if JSON is invalid or required fields are missing/malformed
 */
export function deserializeScheduleJSON(json: string): ShareableState {
  const parsed = JSON.parse(json)

  if (!parsed.employees || !Array.isArray(parsed.employees)) {
    throw new Error('Invalid schedule file: employees must be an array')
  }
  if (!parsed.coverageRequirements || !Array.isArray(parsed.coverageRequirements)) {
    throw new Error('Invalid schedule file: coverageRequirements must be an array')
  }
  if (!parsed.schedule || typeof parsed.schedule !== 'object') {
    throw new Error('Invalid schedule file: schedule must be an object')
  }

  return {
    employees: parsed.employees,
    coverageRequirements: parsed.coverageRequirements,
    schedule: parsed.schedule,
  }
}

/**
 * Escape a CSV field value.
 * Wraps in double quotes if the value contains commas, quotes, or newlines.
 */
function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Serialize schedule state to a CSV string.
 * Each assignment becomes a row: Day, Start, End, Employee, Role.
 *
 * @param state - The shareable state payload
 * @returns CSV string ready for file download
 */
export function serializeScheduleCSV(state: ShareableState): string {
  const header = 'Day,Start,End,Employee,Role'
  const rows: string[] = []

  for (const assignment of state.schedule.assignments) {
    const shift = state.schedule.shifts.find((s) => s.id === assignment.shiftId)
    const employee = state.employees.find((e) => e.id === assignment.employeeId)

    if (!shift || !employee) continue

    rows.push(
      [
        escapeCsvField(shift.day),
        escapeCsvField(shift.startTime),
        escapeCsvField(shift.endTime),
        escapeCsvField(employee.name),
        escapeCsvField(employee.role),
      ].join(','),
    )
  }

  return rows.length > 0 ? `${header}\n${rows.join('\n')}` : header
}

/**
 * Trigger a file download in the browser.
 * Creates a temporary `<a>` element with a Blob URL.
 *
 * @param content - File content string
 * @param filename - Suggested filename
 * @param mimeType - MIME type for the Blob
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Read a File object as text.
 *
 * @param file - File from an input element
 * @returns Promise resolving to the file's text content
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
