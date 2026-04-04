import { create } from 'zustand'
import type { CoverageRequirement } from '../types/index'
import { covrdDb } from '../db/db'

/**
 * Coverage store state and actions.
 */
interface CoverageState {
  requirements: CoverageRequirement[]
  hydrate: (requirements: CoverageRequirement[]) => void
  addRequirement: (req: CoverageRequirement) => void
  updateRequirement: (id: string, updates: Partial<CoverageRequirement>) => void
  removeRequirement: (id: string) => void
  getRequirementsForDate: (date: string) => CoverageRequirement[]
  reset: () => void
}

/**
 * Zustand store for coverage requirements.
 * Manages how many staff are needed per time block per day.
 */
export const useCoverageStore = create<CoverageState>((set, get) => ({
  requirements: [],

  hydrate: (requirements: CoverageRequirement[]) => {
    set({ requirements })
  },

  addRequirement: (req) => {
    covrdDb.coverageRequirements.put(req).catch(console.error)
    set((state) => ({
      requirements: [...state.requirements, req],
    }))
  },

  updateRequirement: (id, updates) => {
    set((state) => {
      const requirements = state.requirements.map((req) => {
        if (req.id === id) {
          const updated = { ...req, ...updates }
          covrdDb.coverageRequirements.put(updated).catch(console.error)
          return updated
        }
        return req
      })
      return { requirements }
    })
  },

  removeRequirement: (id) => {
    covrdDb.coverageRequirements.delete(id).catch(console.error)
    set((state) => ({
      requirements: state.requirements.filter((req) => req.id !== id),
    }))
  },

  getRequirementsForDate: (date) => {
    return get().requirements.filter((req) => req.date === date)
  },

  reset: () => {
    set({ requirements: [] })
  },
}))
