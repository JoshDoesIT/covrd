import { create } from 'zustand'
import type { Schedule, ShiftAssignment } from '../types/index'

/**
 * Schedule store state and actions.
 */
interface ScheduleState {
  activeSchedule: Schedule | null
  scheduleHistory: Schedule[]
  setActiveSchedule: (schedule: Schedule) => void
  clearActiveSchedule: () => void
  saveToHistory: (schedule: Schedule) => void
  addAssignment: (assignment: Omit<ShiftAssignment, 'id'>) => void
  removeAssignment: (assignmentId: string) => void
  isSandboxMode: boolean
  baselineSchedule: Schedule | null
  enableSandbox: () => void
  commitSandbox: () => void
  discardSandbox: () => void
  reset: () => void
}

/**
 * Zustand store for schedule management.
 * Handles the active schedule, assignments, and history.
 */
export const useScheduleStore = create<ScheduleState>((set) => ({
  activeSchedule: null,
  scheduleHistory: [],
  isSandboxMode: false,
  baselineSchedule: null,

  setActiveSchedule: (schedule) => {
    set({ activeSchedule: schedule })
  },

  clearActiveSchedule: () => {
    set({ activeSchedule: null })
  },

  saveToHistory: (schedule) => {
    set((state) => ({
      scheduleHistory: [...state.scheduleHistory, schedule],
    }))
  },

  addAssignment: (assignment) => {
    set((state) => {
      if (!state.activeSchedule) return state

      const newAssignment: ShiftAssignment = {
        ...assignment,
        id: crypto.randomUUID(),
      }

      return {
        activeSchedule: {
          ...state.activeSchedule,
          assignments: [...state.activeSchedule.assignments, newAssignment],
          updatedAt: new Date().toISOString(),
        },
      }
    })
  },

  removeAssignment: (assignmentId) => {
    set((state) => {
      if (!state.activeSchedule) return state

      return {
        activeSchedule: {
          ...state.activeSchedule,
          assignments: state.activeSchedule.assignments.filter((a) => a.id !== assignmentId),
          updatedAt: new Date().toISOString(),
        },
      }
    })
  },

  enableSandbox: () => {
    set((state) => ({
      isSandboxMode: true,
      baselineSchedule: state.activeSchedule ? JSON.parse(JSON.stringify(state.activeSchedule)) : null,
    }))
  },

  commitSandbox: () => {
    set({
      isSandboxMode: false,
      baselineSchedule: null,
    })
  },

  discardSandbox: () => {
    set((state) => ({
      isSandboxMode: false,
      activeSchedule: state.baselineSchedule ? JSON.parse(JSON.stringify(state.baselineSchedule)) : null,
      baselineSchedule: null,
    }))
  },

  reset: () => {
    set({ activeSchedule: null, scheduleHistory: [], isSandboxMode: false, baselineSchedule: null })
  },
}))
