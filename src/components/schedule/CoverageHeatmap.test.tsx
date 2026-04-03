import { render, screen } from '@testing-library/react'
import { CoverageHeatmap } from './CoverageHeatmap'
import { expect } from 'vitest'

describe('CoverageHeatmap', () => {
  it('renders a coverage title', () => {
    // Basic test just to ensure it mounts and exists
    render(<CoverageHeatmap />)
    expect(screen.getByText('Coverage Analytics')).toBeInTheDocument()
  })
})
