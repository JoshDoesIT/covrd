import { render, screen } from '@testing-library/react'
import { TimelineGrid } from './TimelineGrid'
import { expect } from 'vitest'

describe('TimelineGrid', () => {
  it('renders standard timeline view text when empty', () => {
    // Should gracefully render a message if there's no data or active schedule
    render(<TimelineGrid />)
    expect(screen.getByText('Timeline Gantt View')).toBeInTheDocument()
  })
})
