import { render, screen } from '@testing-library/react'
import { FairnessChart } from './FairnessChart'
import { expect } from 'vitest'

describe('FairnessChart', () => {
  it('renders fairness analytics title', () => {
    render(<FairnessChart activeWeekNumber={0} />)
    expect(screen.getByText('Fairness Metrics')).toBeInTheDocument()
  })
})
