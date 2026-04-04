import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ShareToolbar } from './ShareToolbar'
import { createEmployee, createCoverageRequirement, createSchedule } from '../../types/factories'
import type { ShareableState } from '../../stores/urlState'

describe('ShareToolbar', () => {
  const state: ShareableState = {
    employees: [createEmployee({ id: 'e1', name: 'Alice', role: 'Cashier' })],
    coverageRequirements: [
      createCoverageRequirement({
        id: 'c1',
        date: '2026-04-06',
        startTime: '09:00',
        endTime: '13:00',
        requiredStaff: 2,
      }),
    ],
    schedule: createSchedule({
      id: 's1',
      name: 'Week 1',
      startDate: '2026-04-06',
      endDate: '2026-04-12',
      shifts: [
        {
          id: 'sh1',
          day: 'monday',
          startTime: '09:00',
          endTime: '13:00',
          requiredStaff: 1,
        },
      ],
      assignments: [{ id: 'a1', shiftId: 'sh1', employeeId: 'e1', isManual: false }],
    }),
  }

  it('renders export JSON button', () => {
    render(<ShareToolbar state={state} />)
    expect(screen.getByRole('button', { name: /export json/i })).toBeInTheDocument()
  })

  it('renders export CSV button', () => {
    render(<ShareToolbar state={state} />)
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument()
  })

  it('renders import button', () => {
    render(<ShareToolbar state={state} />)
    expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument()
  })

  it('renders print button', () => {
    render(<ShareToolbar state={state} />)
    expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument()
  })

  it('renders share link button', () => {
    render(<ShareToolbar state={state} />)
    expect(screen.getByRole('button', { name: /share link/i })).toBeInTheDocument()
  })

  it('calls onImport when a file is uploaded', async () => {
    const onImport = vi.fn()
    render(<ShareToolbar state={state} onImport={onImport} />)

    const file = new File(['{}'], 'schedule.json', { type: 'application/json' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    expect(input).not.toBeNull()
    await userEvent.upload(input, file)
    expect(onImport).toHaveBeenCalledWith(file)
  })

  it('shows toast after share link is clicked', async () => {
    // Mock clipboard API
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    render(<ShareToolbar state={state} />)

    const shareBtn = screen.getByRole('button', { name: /share link/i })
    await userEvent.click(shareBtn)

    expect(writeText).toHaveBeenCalled()
    expect(screen.getByText(/copied/i)).toBeInTheDocument()
  })
})
