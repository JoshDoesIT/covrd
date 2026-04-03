import { useScheduleStore } from './scheduleStore'
import { createSchedule, createShift } from '../types/factories'

describe('Schedule Store', () => {
  beforeEach(() => {
    useScheduleStore.getState().reset()
  })

  it('starts with no active schedule', () => {
    const { activeSchedule, scheduleHistory } = useScheduleStore.getState()
    expect(activeSchedule).toBeNull()
    expect(scheduleHistory).toEqual([])
  })

  it('sets the active schedule', () => {
    const { setActiveSchedule } = useScheduleStore.getState()
    const schedule = createSchedule({
      name: 'Week 1',
      startDate: '2026-04-06',
      endDate: '2026-04-12',
    })

    setActiveSchedule(schedule)

    const { activeSchedule } = useScheduleStore.getState()
    expect(activeSchedule?.name).toBe('Week 1')
  })

  it('saves a schedule to history', () => {
    const { saveToHistory } = useScheduleStore.getState()
    const schedule = createSchedule({
      name: 'Week 1',
      startDate: '2026-04-06',
      endDate: '2026-04-12',
    })

    saveToHistory(schedule)

    const { scheduleHistory } = useScheduleStore.getState()
    expect(scheduleHistory).toHaveLength(1)
    expect(scheduleHistory[0].name).toBe('Week 1')
  })

  it('adds an assignment to the active schedule', () => {
    const { setActiveSchedule, addAssignment } = useScheduleStore.getState()
    const shift = createShift({
      day: 'monday',
      startTime: '09:00',
      endTime: '17:00',
      requiredStaff: 1,
    })
    const schedule = createSchedule({
      name: 'Week 1',
      startDate: '2026-04-06',
      endDate: '2026-04-12',
      shifts: [shift],
    })

    setActiveSchedule(schedule)
    addAssignment({ shiftId: shift.id, employeeId: 'emp-1', isManual: true })

    const { activeSchedule } = useScheduleStore.getState()
    expect(activeSchedule?.assignments).toHaveLength(1)
    expect(activeSchedule?.assignments[0].employeeId).toBe('emp-1')
  })

  it('removes an assignment from the active schedule', () => {
    const { setActiveSchedule, addAssignment, removeAssignment } = useScheduleStore.getState()
    const shift = createShift({
      day: 'monday',
      startTime: '09:00',
      endTime: '17:00',
      requiredStaff: 1,
    })
    const schedule = createSchedule({
      name: 'Week 1',
      startDate: '2026-04-06',
      endDate: '2026-04-12',
      shifts: [shift],
    })

    setActiveSchedule(schedule)
    addAssignment({ shiftId: shift.id, employeeId: 'emp-1', isManual: true })

    const assignmentId = useScheduleStore.getState().activeSchedule!.assignments[0].id
    removeAssignment(assignmentId)

    const { activeSchedule } = useScheduleStore.getState()
    expect(activeSchedule?.assignments).toHaveLength(0)
  })

  it('clears the active schedule', () => {
    const { setActiveSchedule, clearActiveSchedule } = useScheduleStore.getState()
    const schedule = createSchedule({
      name: 'Week 1',
      startDate: '2026-04-06',
      endDate: '2026-04-12',
    })

    setActiveSchedule(schedule)
    clearActiveSchedule()

    const { activeSchedule } = useScheduleStore.getState()
    expect(activeSchedule).toBeNull()
  })

  // --- Phase 4C: Sandbox Mode Tests ---

  it('enables sandbox mode and creates a baseline backup of the active schedule', () => {
    const { setActiveSchedule, enableSandbox } = useScheduleStore.getState()
    const schedule = createSchedule({
      name: 'Sandbox Week',
      startDate: '2026-04-06',
      endDate: '2026-04-12',
      assignments: [{ id: 'a1', shiftId: 's1', employeeId: 'e1', isManual: true }]
    })
    
    setActiveSchedule(schedule)
    enableSandbox()

    const { isSandboxMode, baselineSchedule, activeSchedule } = useScheduleStore.getState()
    expect(isSandboxMode).toBe(true)
    expect(baselineSchedule).not.toBeNull()
    expect(baselineSchedule?.assignments).toHaveLength(1)
    
    // Baseline should be a deep clone, so modifying active doesn't mutate baseline natively
    expect(baselineSchedule).toEqual(activeSchedule)
    expect(baselineSchedule).not.toBe(activeSchedule)
  })

  it('discards sandbox changes, restoring the active schedule back to baseline', () => {
    const { setActiveSchedule, enableSandbox, addAssignment, discardSandbox } = useScheduleStore.getState()
    const schedule = createSchedule({
      name: 'Sandbox Week',
      startDate: '2026-04-06',
      endDate: '2026-04-12',
    })
    
    setActiveSchedule(schedule)
    enableSandbox() // baseline is now 0 assignments

    // Simulate an edit in sandbox mode
    addAssignment({ shiftId: 's1', employeeId: 'e1', isManual: true })
    
    expect(useScheduleStore.getState().activeSchedule?.assignments).toHaveLength(1)
    
    discardSandbox()

    const { isSandboxMode, baselineSchedule, activeSchedule } = useScheduleStore.getState()
    expect(isSandboxMode).toBe(false)
    expect(baselineSchedule).toBeNull() // baseline cleanly wiped
    expect(activeSchedule?.assignments).toHaveLength(0) // restored properly
  })

  it('commits sandbox changes, destroying baseline but keeping active schedule modifications', () => {
    const { setActiveSchedule, enableSandbox, addAssignment, commitSandbox } = useScheduleStore.getState()
    const schedule = createSchedule({
      name: 'Sandbox Week',
      startDate: '2026-04-06',
      endDate: '2026-04-12',
    })
    
    setActiveSchedule(schedule)
    enableSandbox() // baseline is 0 assignments

    // Simulate an edit in sandbox mode
    addAssignment({ shiftId: 's1', employeeId: 'e2', isManual: true })
    
    commitSandbox()

    const { isSandboxMode, baselineSchedule, activeSchedule } = useScheduleStore.getState()
    expect(isSandboxMode).toBe(false)
    expect(baselineSchedule).toBeNull()
    expect(activeSchedule?.assignments).toHaveLength(1) // changes kept!
    expect(activeSchedule?.assignments[0].employeeId).toBe('e2')
  })
})
