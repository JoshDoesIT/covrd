import type { Employee, Shift, Schedule } from '../types/index'
import { DAYS_OF_WEEK } from '../types/index'
import { formatTime } from './formatTime'
import { formatDayHeader, formatWeekRange } from './scheduleDates'

/**
 * Generates a standalone HTML print document for the schedule and opens
 * the browser's native print dialog. This bypasses all CSS override issues
 * by rendering a clean, purpose-built HTML `<table>` in a new window.
 *
 * Key features:
 * - `<thead>` repeats on every printed page (native browser behavior for standalone tables)
 * - Rows use `page-break-inside: avoid` so employee rows never split across pages
 * - Landscape orientation enforced via `@page`
 * - High-contrast black-on-white, ink-saving output
 */
export function printSchedule(
  schedule: Schedule,
  employees: Employee[],
  timeFormat: '12h' | '24h',
): void {
  const startDate = schedule.startDate

  // Calculate total weeks in this schedule
  const totalWeeks =
    Math.ceil(
      (new Date(schedule.endDate).getTime() - new Date(schedule.startDate).getTime()) /
        (7 * 24 * 60 * 60 * 1000),
    ) || 1

  // Build one table per week
  const weekTables: string[] = []

  for (let w = 0; w < totalWeeks; w++) {
    const weekRange = formatWeekRange(startDate, w)

    // Build header row
    const headerCells = DAYS_OF_WEEK.map(
      (day) => `<th>${formatDayHeader(startDate, w, day)}</th>`,
    ).join('')

    // Build employee rows
    const bodyRows: string[] = []

    // Employee rows
    for (const emp of employees) {
      const assignedShifts = schedule.assignments
        .filter((a) => a.employeeId === emp.id)
        .map((a) => schedule.shifts.find((s) => s.id === a.shiftId))
        .filter((s): s is Shift => !!s && (s.weekNumber || 0) === w)

      let totalHours = 0
      assignedShifts.forEach((s) => {
        const st = parseInt(s.startTime.split(':')[0], 10)
        const et = parseInt(s.endTime.split(':')[0], 10)
        let duration = et > st ? et - st : 24 - st + et
        if (s.unpaidBreakMinutes) duration -= s.unpaidBreakMinutes / 60
        totalHours += duration
      })

      const overHours = totalHours > emp.maxHoursPerWeek

      const cells = DAYS_OF_WEEK.map((day) => {
        const dayShifts = assignedShifts.filter((s) => s.day === day)
        if (dayShifts.length === 0) return '<td></td>'

        const pills = dayShifts
          .map(
            (s) =>
              `<div class="shift-pill">${formatTime(s.startTime, timeFormat)} - ${formatTime(s.endTime, timeFormat)}${s.role ? `<br><small>${s.role}</small>` : ''}</div>`,
          )
          .join('')

        return `<td>${pills}</td>`
      }).join('')

      bodyRows.push(
        `<tr><th class="row-label">${emp.name}<br><small class="${overHours ? 'over-hours' : ''}">${totalHours}h / ${emp.maxHoursPerWeek}h</small></th>${cells}</tr>`,
      )
    }

    weekTables.push(`
      <div class="week-section">
        <h2>Week ${w + 1} — ${weekRange}</h2>
        <table class="schedule-grid">
          <thead>
            <tr>
              <th class="corner">Roster</th>
              ${headerCells}
            </tr>
          </thead>
          <tbody>
            ${bodyRows.join('\n')}
          </tbody>
        </table>
      </div>
    `)
  }
  // Build cover page stats
  const totalShifts = schedule.shifts.length
  const filledShifts = totalShifts - schedule.unfilledShiftIds.length
  const fillRate = totalShifts > 0 ? Math.round((filledShifts / totalShifts) * 100) : 0
  const dateRange = `${formatWeekRange(startDate, 0)}${totalWeeks > 1 ? ` → ${formatWeekRange(startDate, totalWeeks - 1)}` : ''}`

  // Build employee roster rows for cover page
  const rosterRows = employees.map((emp) => {
    const empAssignments = schedule.assignments.filter((a) => a.employeeId === emp.id).length
    return `<tr>
      <td style="font-weight:600">${emp.name}</td>
      <td>${emp.role}</td>
      <td>${emp.employmentType}</td>
      <td>${emp.maxHoursPerWeek}h</td>
      <td>${empAssignments}</td>
    </tr>`
  }).join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${schedule.name} — Covrd Schedule</title>
  <style>
    @page {
      size: landscape;
      margin: 0.5in;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10pt;
      color: #000;
      background: #fff;
    }

    /* --- Cover Page --- */
    .cover-page {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      min-height: 90vh;
    }

    .cover-title {
      text-align: center;
      padding: 40px 0 24px;
      border-bottom: 3px solid #000;
      margin-bottom: 32px;
    }

    .cover-title h1 {
      font-size: 24pt;
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }

    .cover-title .subtitle {
      font-size: 11pt;
      color: #555;
    }

    .cover-stats {
      display: flex;
      gap: 16px;
      margin-bottom: 32px;
    }

    .cover-stat {
      flex: 1;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 12px 16px;
      text-align: center;
    }

    .cover-stat .value {
      font-size: 20pt;
      font-weight: 700;
      display: block;
      margin-bottom: 2px;
    }

    .cover-stat .label {
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #666;
    }

    .cover-section {
      margin-bottom: 24px;
    }

    .cover-section h3 {
      font-size: 11pt;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #ccc;
    }

    .roster-table {
      width: 100%;
      border-collapse: collapse;
    }

    .roster-table th,
    .roster-table td {
      border: 1px solid #ddd;
      padding: 6px 10px;
      font-size: 9pt;
      text-align: left;
    }

    .roster-table thead th {
      background: #f0f0f0;
      font-weight: 700;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .cover-footer {
      margin-top: auto;
      text-align: center;
      font-size: 8pt;
      color: #999;
      border-top: 1px solid #ddd;
      padding-top: 8px;
    }

    /* --- Schedule Pages --- */
    .week-section {
      margin-bottom: 24px;
    }

    .week-section + .week-section {
      page-break-before: always;
    }

    .week-section h2 {
      font-size: 12pt;
      margin-bottom: 8px;
      padding: 4px 0;
      border-bottom: 1px solid #999;
    }

    table.schedule-grid {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    table.schedule-grid thead {
      display: table-header-group;
    }

    table.schedule-grid tbody {
      display: table-row-group;
    }

    table.schedule-grid th,
    table.schedule-grid td {
      border: 1px solid #333;
      padding: 6px;
      vertical-align: top;
      font-size: 9pt;
    }

    table.schedule-grid thead th {
      background: #e8e8e8;
      text-align: center;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8pt;
      letter-spacing: 0.03em;
    }

    table.schedule-grid thead th.corner {
      text-align: left;
      width: 140px;
    }

    .row-label {
      text-align: left;
      font-weight: 600;
      width: 140px;
      background: #f5f5f5;
    }

    .row-label small {
      font-weight: 400;
      color: #666;
    }

    .over-hours {
      color: #c00 !important;
      font-weight: 600;
    }

    table.schedule-grid tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .shift-pill {
      background: #f0f0f0;
      border: 1px solid #ccc;
      border-radius: 3px;
      padding: 3px 5px;
      margin-bottom: 3px;
      font-size: 8pt;
      line-height: 1.3;
    }

    .shift-pill small {
      color: #666;
    }

    .print-footer {
      margin-top: 12px;
      text-align: center;
      font-size: 8pt;
      color: #999;
      border-top: 1px solid #ccc;
      padding-top: 6px;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-title">
      <h1>${schedule.name}</h1>
      <div class="subtitle">${dateRange}</div>
    </div>

    <div class="cover-stats">
      <div class="cover-stat">
        <span class="value">${employees.length}</span>
        <span class="label">Employees</span>
      </div>
      <div class="cover-stat">
        <span class="value">${totalWeeks}</span>
        <span class="label">Week${totalWeeks > 1 ? 's' : ''}</span>
      </div>
      <div class="cover-stat">
        <span class="value">${schedule.assignments.length}</span>
        <span class="label">Assignments</span>
      </div>
      <div class="cover-stat">
        <span class="value">${fillRate}%</span>
        <span class="label">Fill Rate</span>
      </div>
    </div>

    <div class="cover-section">
      <h3>Employee Roster</h3>
      <table class="roster-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Type</th>
            <th>Max Hours</th>
            <th>Assignments</th>
          </tr>
        </thead>
        <tbody>
          ${rosterRows}
        </tbody>
      </table>
    </div>

    <div class="cover-footer">
      Generated ${new Date(schedule.createdAt).toLocaleDateString()} &middot; Quality Score: ${schedule.qualityScore ?? 'N/A'}${schedule.unfilledShiftIds.length > 0 ? ` &middot; ${schedule.unfilledShiftIds.length} unfilled shift${schedule.unfilledShiftIds.length > 1 ? 's' : ''}` : ''}
    </div>
  </div>

  <!-- Schedule Grids -->
  ${weekTables.join('\n')}

  <div class="print-footer">
    Printed from Covrd &middot; ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
  </div>
</body>
</html>`

  // Open in a new window and trigger print
  const printWindow = window.open('', '_blank', 'width=1100,height=800')
  if (!printWindow) {
    alert('Please allow pop-ups to print the schedule.')
    return
  }

  printWindow.document.write(html)
  printWindow.document.close()

  // Wait for the document to fully render before printing
  printWindow.onload = () => {
    printWindow.focus()
    printWindow.print()
  }

  // Fallback: if onload doesn't fire (some browsers), try after a delay
  setTimeout(() => {
    try {
      printWindow.focus()
      printWindow.print()
    } catch {
      // Window may already be closed
    }
  }, 500)
}
