import { describe, test, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingWizard } from './OnboardingWizard'

describe('OnboardingWizard', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('renders the welcome step initially', () => {
    render(<OnboardingWizard onComplete={() => {}} />)
    expect(screen.getByText(/welcome to covrd/i)).toBeInTheDocument()
  })

  test('advances to next step on click', async () => {
    const user = userEvent.setup()
    render(<OnboardingWizard onComplete={() => {}} />)
    await user.click(screen.getByRole('button', { name: /get started/i }))
    expect(screen.getByText(/add employees/i)).toBeInTheDocument()
  })

  test('can skip the wizard', async () => {
    const user = userEvent.setup()
    let completed = false
    render(<OnboardingWizard onComplete={() => { completed = true }} />)
    await user.click(screen.getByRole('button', { name: /skip/i }))
    expect(completed).toBe(true)
  })

  test('shows progress indicator', () => {
    render(<OnboardingWizard onComplete={() => {}} />)
    expect(screen.getByText(/step 1/i)).toBeInTheDocument()
  })

  test('can load demo data from wizard', async () => {
    const user = userEvent.setup()
    render(<OnboardingWizard onComplete={() => {}} />)
    await user.click(screen.getByRole('button', { name: /get started/i }))
    // Should have a "Load Demo" option
    expect(screen.getByRole('button', { name: /load demo/i })).toBeInTheDocument()
  })

  test('calls onComplete on final step', async () => {
    const user = userEvent.setup()
    let completed = false
    render(<OnboardingWizard onComplete={() => { completed = true }} />)
    // Step 1 -> 2
    await user.click(screen.getByRole('button', { name: /get started/i }))
    // Step 2 -> 3
    await user.click(screen.getByRole('button', { name: /next/i }))
    // Step 3 -> 4
    await user.click(screen.getByRole('button', { name: /next/i }))
    // Final step -> complete
    await user.click(screen.getByRole('button', { name: /start scheduling/i }))
    expect(completed).toBe(true)
  })
})
