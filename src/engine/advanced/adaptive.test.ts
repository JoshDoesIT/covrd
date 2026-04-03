import { calculateCandidateWeights } from './adaptive'

describe('Adaptive Learning', () => {
  it('applies negative weight to candidates frequently overridden by manager', () => {
    // 3 overrides where emp-1 was removed from Monday shifts.
    // They should get a lower score than default so solver avoids picking them.
    const historicalOverrides = [
      { employeeId: 'emp-1', removedFromDay: 1, addedToDay: 2 },
      { employeeId: 'emp-1', removedFromDay: 1, addedToDay: 2 },
      { employeeId: 'emp-1', removedFromDay: 1, addedToDay: 2 },
    ]

    const weights = calculateCandidateWeights(['emp-1', 'emp-2'], 1, historicalOverrides)

    // emp-1 was removed from day 1 three times. Weight should be -3.
    expect(weights.get('emp-1')).toBeLessThan(0)
    // emp-2 has no history. Weight should be 0.
    expect(weights.get('emp-2')).toBe(0)
  })

  it('applies positive weight to candidates manually added by manager', () => {
    const historicalOverrides = [{ employeeId: 'emp-2', removedFromDay: 3, addedToDay: 1 }]

    const weights = calculateCandidateWeights(['emp-1', 'emp-2'], 1, historicalOverrides)

    // emp-2 was added to day 1 once. Weight should be +1.
    expect(weights.get('emp-2')).toBeGreaterThan(0)
  })
})
