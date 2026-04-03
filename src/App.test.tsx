import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  it('renders the AppShell with sidebar navigation', () => {
    render(<App />)
    expect(screen.getByRole('navigation', { name: /sidebar/i })).toBeInTheDocument()
  })

  it('renders the layout header', () => {
    render(<App />)
    expect(screen.getAllByRole('banner').length).toBeGreaterThanOrEqual(1)
  })

  it('renders a main content area', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('displays the Covrd brand', () => {
    render(<App />)
    expect(screen.getByText(/Covr/)).toBeInTheDocument()
  })
})
