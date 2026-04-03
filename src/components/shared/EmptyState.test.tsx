import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  test('renders title and description', () => {
    render(<EmptyState title="No employees" description="Add your first team member." />)
    expect(screen.getByText('No employees')).toBeInTheDocument()
    expect(screen.getByText('Add your first team member.')).toBeInTheDocument()
  })

  test('renders CTA button when provided', () => {
    render(
      <EmptyState
        title="No data"
        description="Get started"
        ctaLabel="Add Item"
        onCtaClick={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument()
  })

  test('does not render CTA button when not provided', () => {
    render(<EmptyState title="Empty" description="Nothing here" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  test('calls onCtaClick when CTA is clicked', async () => {
    const user = userEvent.setup()
    let clicked = false
    render(
      <EmptyState
        title="Empty"
        description="Click below"
        ctaLabel="Do it"
        onCtaClick={() => {
          clicked = true
        }}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Do it' }))
    expect(clicked).toBe(true)
  })

  test('renders custom icon when provided', () => {
    render(
      <EmptyState
        title="Custom"
        description="With icon"
        icon={<span data-testid="custom-icon">★</span>}
      />,
    )
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })
})
