import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  beforeEach(() => {
    window.location.hash = 'app'
  })
  it('renders the AppShell with sidebar navigation', async () => {
    render(<App />)
    expect(await screen.findByRole('navigation', { name: /sidebar/i })).toBeInTheDocument()
  })

  it('renders the layout header', async () => {
    render(<App />)
    const elements = await screen.findAllByRole('banner')
    expect(elements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders a main content area', async () => {
    render(<App />)
    expect(await screen.findByRole('main')).toBeInTheDocument()
  })

  it('displays the Covrd brand', async () => {
    render(<App />)
    const logos = await screen.findAllByAltText('Covrd')
    expect(logos.length).toBeGreaterThanOrEqual(1)
  })
})
