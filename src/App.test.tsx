import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  it('renders the Covrd brand name', () => {
    render(<App />)
    expect(screen.getByText(/Covr/)).toBeInTheDocument()
  })

  it('renders the tagline', () => {
    render(<App />)
    expect(screen.getByText('Every shift. Covered.')).toBeInTheDocument()
  })

  it('renders the privacy badge', () => {
    render(<App />)
    expect(screen.getByText('Privacy-first scheduling')).toBeInTheDocument()
  })

  it('has an accessible main landmark', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})
