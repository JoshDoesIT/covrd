import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Toast } from './Toast'

describe('Toast (Story 6.7)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the message text', () => {
    render(<Toast message="Link copied!" onDismiss={() => {}} />)
    expect(screen.getByText('Link copied!')).toBeInTheDocument()
  })

  it('auto-dismisses after 3 seconds', () => {
    const onDismiss = vi.fn()
    render(<Toast message="Link copied!" onDismiss={onDismiss} />)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('does not dismiss before 3 seconds', () => {
    const onDismiss = vi.fn()
    render(<Toast message="Link copied!" onDismiss={onDismiss} />)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('has the correct accessibility role', () => {
    render(<Toast message="Link copied!" onDismiss={() => {}} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
