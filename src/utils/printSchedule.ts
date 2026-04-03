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
    const weekShifts = schedule.shifts.filter((s) => (s.weekNumber || 0) === w)

    const weekRange = formatWeekRange(startDate, w)

    // Build header row
    const headerCells = DAYS_OF_WEEK.map(
      (day) => `<th>${formatDayHeader(startDate, w, day)}</th>`,
    ).join('')

    // Build employee rows
    const bodyRows: string[] = []

    // Unassigned pool row
    const unassignedCells = DAYS_OF_WEEK.map((day) => {
      const dayShifts = weekShifts.filter((s) => s.day === day)
      const unassigned = dayShifts.filter((s) => {
        const assignedCount = schedule.assignments.filter((a) => a.shiftId === s.id).length
        return assignedCount === 0
      })

      if (unassigned.length === 0) return '<td></td>'

      const pills = unassigned
        .map(
          (s) =>
            `<div class="shift-pill unassigned">${formatTime(s.startTime, timeFormat)} - ${formatTime(s.endTime, timeFormat)}${s.role ? `<br><small>${s.role}</small>` : ''}</div>`,
        )
        .join('')

      return `<td>${pills}</td>`
    }).join('')

    bodyRows.push(
      `<tr class="unassigned-row"><th class="row-label">Unassigned<br><small>Need Staff</small></th>${unassignedCells}</tr>`,
    )

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
        <table>
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

    .print-header {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #000;
    }

    .print-header h1 {
      font-size: 16pt;
      margin-bottom: 2px;
    }

    .print-header p {
      font-size: 9pt;
      color: #555;
    }

    .week-section {
      page-break-after: always;
      margin-bottom: 24px;
    }

    .week-section:last-child {
      page-break-after: auto;
    }

    .week-section h2 {
      font-size: 12pt;
      margin-bottom: 8px;
      padding: 4px 0;
      border-bottom: 1px solid #999;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    thead {
      display: table-header-group;
    }

    tbody {
      display: table-row-group;
    }

    th, td {
      border: 1px solid #333;
      padding: 6px;
      vertical-align: top;
      font-size: 9pt;
    }

    thead th {
      background: #e8e8e8;
      text-align: center;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8pt;
      letter-spacing: 0.03em;
    }

    thead th.corner {
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

    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .unassigned-row {
      background: #fff5f5;
    }

    .unassigned-row .row-label {
      background: #fff0f0;
      color: #c00;
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

    .shift-pill.unassigned {
      background: #ffe8e8;
      border-color: #e0a0a0;
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
  <div class="print-header">
    <h1>${schedule.name}</h1>
    <p>${schedule.assignments.length} assignments across ${totalWeeks} week${totalWeeks > 1 ? 's' : ''} &middot; Generated ${new Date(schedule.createdAt).toLocaleDateString()}</p>
  </div>

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
