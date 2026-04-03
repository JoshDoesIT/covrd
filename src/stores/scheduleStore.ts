import { create } from 'zustand'
import type { Schedule, ShiftAssignment } from '../types/index'
import { covrdDb } from '../db/db'
import { UndoRedoManager } from '../hooks/useUndoRedo'

const undoManager = new UndoRedoManager<Schedule>()

/**
 * Schedule store state and actions.
 */
interface ScheduleState {
  allSchedules: Schedule[]
  activeSchedule: Schedule | null
  hydrate: (schedules: Schedule[]) => void
  setActiveSchedule: (schedule: Schedule) => void
  clearActiveSchedule: () => void
  addAssignment: (assignment: Omit<ShiftAssignment, 'id'>) => void
  removeAssignment: (assignmentId: string) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  isSandboxMode: boolean
  baselineSchedule: Schedule | null
  enableSandbox: () => void
  commitSandbox: () => void
  discardSandbox: () => void
  reset: () => void
  pendingTemplateId: string | null
  setPendingTemplateId: (id: string | null) => void
}

/**
 * Zustand store for schedule management.
 * Handles the active schedule, assignments, and history.
 */
export const useScheduleStore = create<ScheduleState>((set) => ({
  allSchedules: [],
  activeSchedule: null,
  isSandboxMode: false,
  baselineSchedule: null,
  pendingTemplateId: null,
  canUndo: false,
  canRedo: false,

  setPendingTemplateId: (id) => set({ pendingTemplateId: id }),

  hydrate: (schedules) => {
    // If there's a schedule, set the most recent as active.
    // In a full app you might track 'active' explicitly via a flag, but latest works for demo.
    const active = schedules.length > 0 ? schedules[schedules.length - 1] : null
    set({ activeSchedule: active, allSchedules: schedules })
  },

  setActiveSchedule: (schedule) => {
    covrdDb.schedules.put(schedule).catch(console.error)
    undoManager.clear()
    set((state) => {
      // Update allSchedules with the new or updated schedule
      const existingIdx = state.allSchedules.findIndex((s) => s.id === schedule.id)
      const newAll = [...state.allSchedules]
      if (existingIdx >= 0) {
        newAll[existingIdx] = schedule
      } else {
        newAll.push(schedule)
      }
      // Sort chronologically just in case
      newAll.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

      return { activeSchedule: schedule, allSchedules: newAll, canUndo: false, canRedo: false }
    })
  },

  clearActiveSchedule: () => {
    set({ activeSchedule: null })
  },

  addAssignment: (assignment) => {
    set((state) => {
      if (!state.activeSchedule) return state

      undoManager.push(state.activeSchedule)

      const newAssignment: ShiftAssignment = {
        ...assignment,
        id: crypto.randomUUID(),
      }

      const updated = {
        ...state.activeSchedule,
        assignments: [...state.activeSchedule.assignments, newAssignment],
        updatedAt: new Date().toISOString(),
      }
      covrdDb.schedules.put(updated).catch(console.error)

      const newAll = [...state.allSchedules]
      const existingIdx = newAll.findIndex((s) => s.id === updated.id)
      if (existingIdx >= 0) newAll[existingIdx] = updated

      return {
        activeSchedule: updated,
        allSchedules: newAll,
        canUndo: undoManager.canUndo,
        canRedo: undoManager.canRedo,
      }
    })
  },

  removeAssignment: (assignmentId) => {
    set((state) => {
      if (!state.activeSchedule) return state

      undoManager.push(state.activeSchedule)

      const updated = {
        ...state.activeSchedule,
        assignments: state.activeSchedule.assignments.filter((a) => a.id !== assignmentId),
        updatedAt: new Date().toISOString(),
      }
      covrdDb.schedules.put(updated).catch(console.error)

      const newAll = [...state.allSchedules]
      const existingIdx = newAll.findIndex((s) => s.id === updated.id)
      if (existingIdx >= 0) newAll[existingIdx] = updated

      return {
        activeSchedule: updated,
        allSchedules: newAll,
        canUndo: undoManager.canUndo,
        canRedo: undoManager.canRedo,
      }
    })
  },

  undo: () => {
    set((state) => {
      if (!state.activeSchedule) return state
      const prev = undoManager.undo()
      if (!prev) return state

      covrdDb.schedules.put(prev).catch(console.error)
      const newAll = [...state.allSchedules]
      const existingIdx = newAll.findIndex((s) => s.id === prev.id)
      if (existingIdx >= 0) newAll[existingIdx] = prev

      return {
        activeSchedule: prev,
        allSchedules: newAll,
        canUndo: undoManager.canUndo,
        canRedo: undoManager.canRedo,
      }
    })
  },

  redo: () => {
    set((state) => {
      if (!state.activeSchedule) return state
      const next = undoManager.redo()
      if (!next) return state

      covrdDb.schedules.put(next).catch(console.error)
      const newAll = [...state.allSchedules]
      const existingIdx = newAll.findIndex((s) => s.id === next.id)
      if (existingIdx >= 0) newAll[existingIdx] = next

      return {
        activeSchedule: next,
        allSchedules: newAll,
        canUndo: undoManager.canUndo,
        canRedo: undoManager.canRedo,
      }
    })
  },

  enableSandbox: () => {
    set((state) => ({
      isSandboxMode: true,
      baselineSchedule: state.activeSchedule
        ? JSON.parse(JSON.stringify(state.activeSchedule))
        : null,
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
      activeSchedule: state.baselineSchedule
        ? JSON.parse(JSON.stringify(state.baselineSchedule))
        : null,
      baselineSchedule: null,
    }))
  },

  reset: () => {
    undoManager.clear()
    set({
      allSchedules: [],
      activeSchedule: null,
      isSandboxMode: false,
      baselineSchedule: null,
      canUndo: false,
      canRedo: false,
    })
  },
}))
