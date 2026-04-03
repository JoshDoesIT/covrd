import { create } from 'zustand'
import type { CoverageRequirement, DayOfWeek } from '../types/index'

/**
 * Coverage store state and actions.
 */
interface CoverageState {
  requirements: CoverageRequirement[]
  addRequirement: (req: CoverageRequirement) => void
  updateRequirement: (id: string, updates: Partial<CoverageRequirement>) => void
  removeRequirement: (id: string) => void
  getRequirementsForDay: (day: DayOfWeek) => CoverageRequirement[]
  reset: () => void
}

/**
 * Zustand store for coverage requirements.
 * Manages how many staff are needed per time block per day.
 */
export const useCoverageStore = create<CoverageState>((set, get) => ({
  requirements: [],

  addRequirement: (req) => {
    set((state) => ({
      requirements: [...state.requirements, req],
    }))
  },

  updateRequirement: (id, updates) => {
    set((state) => ({
      requirements: state.requirements.map((req) => (req.id === id ? { ...req, ...updates } : req)),
    }))
  },

  removeRequirement: (id) => {
    set((state) => ({
      requirements: state.requirements.filter((req) => req.id !== id),
    }))
  },

  getRequirementsForDay: (day) => {
    return get().requirements.filter((req) => req.day === day)
  },

  reset: () => {
    set({ requirements: [] })
  },
}))
