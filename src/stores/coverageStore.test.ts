import { useCoverageStore } from './coverageStore'
import { createCoverageRequirement } from '../types/factories'

describe('Coverage Store', () => {
  beforeEach(() => {
    useCoverageStore.getState().reset()
  })

  it('starts with an empty requirements list', () => {
    const { requirements } = useCoverageStore.getState()
    expect(requirements).toEqual([])
  })

  it('adds a coverage requirement', () => {
    const { addRequirement } = useCoverageStore.getState()
    const req = createCoverageRequirement({
      date: '2026-04-06',
      startTime: '09:00',
      endTime: '13:00',
      requiredStaff: 3,
    })

    addRequirement(req)

    const { requirements } = useCoverageStore.getState()
    expect(requirements).toHaveLength(1)
    expect(requirements[0].date).toBe('2026-04-06')
  })

  it('updates a requirement by id', () => {
    const { addRequirement, updateRequirement } = useCoverageStore.getState()
    const req = createCoverageRequirement({
      date: '2026-04-06',
      startTime: '09:00',
      endTime: '13:00',
      requiredStaff: 3,
    })

    addRequirement(req)
    updateRequirement(req.id, { requiredStaff: 5 })

    const { requirements } = useCoverageStore.getState()
    expect(requirements[0].requiredStaff).toBe(5)
  })

  it('removes a requirement by id', () => {
    const { addRequirement, removeRequirement } = useCoverageStore.getState()
    const req = createCoverageRequirement({
      date: '2026-04-06',
      startTime: '09:00',
      endTime: '13:00',
      requiredStaff: 3,
    })

    addRequirement(req)
    removeRequirement(req.id)

    const { requirements } = useCoverageStore.getState()
    expect(requirements).toEqual([])
  })

  it('gets requirements for a specific day', () => {
    const { addRequirement, getRequirementsForDate } = useCoverageStore.getState()

    addRequirement(
      createCoverageRequirement({
        date: '2026-04-06',
        startTime: '09:00',
        endTime: '13:00',
        requiredStaff: 2,
      }),
    )
    addRequirement(
      createCoverageRequirement({
        date: '2026-04-07',
        startTime: '09:00',
        endTime: '13:00',
        requiredStaff: 3,
      }),
    )

    const mondayReqs = getRequirementsForDate('2026-04-06')
    expect(mondayReqs).toHaveLength(1)
    expect(mondayReqs[0].date).toBe('2026-04-06')
  })
})
