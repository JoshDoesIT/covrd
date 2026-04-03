import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataPurge } from './DataPurge'

describe('DataPurge', () => {
  const mockOnClose = () => {}

  test('renders confirmation dialog', () => {
    render(<DataPurge onClose={mockOnClose} />)
    expect(screen.getByText(/purge all data/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/type delete/i)).toBeInTheDocument()
  })

  test('purge button is disabled until DELETE is typed', () => {
    render(<DataPurge onClose={mockOnClose} />)
    const purgeBtn = screen.getByRole('button', { name: /confirm purge/i })
    expect(purgeBtn).toBeDisabled()
  })

  test('purge button enables when DELETE is typed', async () => {
    const user = userEvent.setup()
    render(<DataPurge onClose={mockOnClose} />)
    const input = screen.getByPlaceholderText(/type delete/i)
    await user.type(input, 'DELETE')
    const purgeBtn = screen.getByRole('button', { name: /confirm purge/i })
    expect(purgeBtn).not.toBeDisabled()
  })

  test('cancel button calls onClose', async () => {
    const user = userEvent.setup()
    let closed = false
    render(
      <DataPurge
        onClose={() => {
          closed = true
        }}
      />,
    )
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(closed).toBe(true)
  })

  test('shows warning message', () => {
    render(<DataPurge onClose={mockOnClose} />)
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument()
  })
})
