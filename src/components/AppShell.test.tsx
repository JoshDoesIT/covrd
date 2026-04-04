import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppShell } from './AppShell'

describe('AppShell', () => {
  it('renders the sidebar', () => {
    render(<AppShell />)
    expect(screen.getByRole('navigation', { name: /sidebar/i })).toBeInTheDocument()
  })

  it('renders the header', () => {
    render(<AppShell />)
    expect(screen.getAllByRole('banner').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the main content area', () => {
    render(<AppShell />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('displays the Covrd logo in the sidebar', () => {
    render(<AppShell />)
    expect(screen.getAllByAltText('Covrd').length).toBeGreaterThanOrEqual(1)
  })

  it('renders navigation items', () => {
    render(<AppShell />)
    expect(screen.getAllByText('Employees').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Coverage')).toBeInTheDocument()
    expect(screen.getAllByText('Schedule').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Knowledge')).toBeInTheDocument()
  })

  it('highlights the active navigation item', () => {
    render(<AppShell />)
    const navButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.classList.contains('shell__nav-item--active'))
    expect(navButtons.length).toBe(1)
    expect(navButtons[0]).toHaveAttribute('aria-current', 'page')
  })

  it('renders the command palette trigger in the header', () => {
    render(<AppShell />)
    expect(screen.getByLabelText(/command palette/i)).toBeInTheDocument()
  })

  it('shows keyboard shortcut hint for command palette', () => {
    render(<AppShell />)
    // Should show Cmd+K on Mac or Ctrl+K hint
    expect(screen.getByText(/\+K/)).toBeInTheDocument()
  })

  it('toggles sidebar collapse', async () => {
    const user = userEvent.setup()
    render(<AppShell />)

    const toggle = screen.getByLabelText(/toggle sidebar/i)
    const sidebar = screen.getByRole('navigation', { name: /sidebar/i })

    expect(sidebar).not.toHaveClass('shell__sidebar--collapsed')

    await user.click(toggle)
    expect(sidebar).toHaveClass('shell__sidebar--collapsed')

    await user.click(toggle)
    expect(sidebar).not.toHaveClass('shell__sidebar--collapsed')
  })

  it('renders the privacy badge in the sidebar', () => {
    render(<AppShell />)
    expect(screen.getByText(/client-side only/i)).toBeInTheDocument()
  })
})
