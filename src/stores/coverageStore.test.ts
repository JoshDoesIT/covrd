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
      name: 'Morning',
      day: 'monday',
      startTime: '09:00',
      endTime: '13:00',
      requiredStaff: 3,
    })

    addRequirement(req)

    const { requirements } = useCoverageStore.getState()
    expect(requirements).toHaveLength(1)
    expect(requirements[0].name).toBe('Morning')
  })

  it('updates a requirement by id', () => {
    const { addRequirement, updateRequirement } = useCoverageStore.getState()
    const req = createCoverageRequirement({
      name: 'Morning',
      day: 'monday',
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
      name: 'Morning',
      day: 'monday',
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
    const { addRequirement, getRequirementsForDay } = useCoverageStore.getState()

    addRequirement(
      createCoverageRequirement({
        name: 'Mon AM',
        day: 'monday',
        startTime: '09:00',
        endTime: '13:00',
        requiredStaff: 2,
      }),
    )
    addRequirement(
      createCoverageRequirement({
        name: 'Tue AM',
        day: 'tuesday',
        startTime: '09:00',
        endTime: '13:00',
        requiredStaff: 3,
      }),
    )

    const mondayReqs = getRequirementsForDay('monday')
    expect(mondayReqs).toHaveLength(1)
    expect(mondayReqs[0].name).toBe('Mon AM')
  })
})
