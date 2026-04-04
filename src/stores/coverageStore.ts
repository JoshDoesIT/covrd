import { create } from 'zustand'
import type { CoverageRequirement, BaselineRequirement } from '../types/index'
import { covrdDb } from '../db/db'

/**
 * Coverage store state and actions.
 */
interface CoverageState {
  requirements: CoverageRequirement[]
  baselineRequirements: BaselineRequirement[]
  hydrate: (requirements: CoverageRequirement[], baselines: BaselineRequirement[]) => void
  addRequirement: (req: CoverageRequirement) => void
  updateRequirement: (id: string, updates: Partial<CoverageRequirement>) => void
  removeRequirement: (id: string) => void
  addBaselineRequirement: (req: BaselineRequirement) => void
  updateBaselineRequirement: (id: string, updates: Partial<BaselineRequirement>) => void
  removeBaselineRequirement: (id: string) => void
  getRequirementsForDate: (date: string) => CoverageRequirement[]
  reset: () => void
}

/**
 * Zustand store for coverage requirements.
 * Manages how many staff are needed per time block per day.
 */
export const useCoverageStore = create<CoverageState>((set, get) => ({
  requirements: [],
  baselineRequirements: [],

  hydrate: (requirements, baselines) => {
    set({ requirements, baselineRequirements: baselines })
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

  addBaselineRequirement: (req) => {
    covrdDb.baselineRequirements.put(req).catch(console.error)
    set((state) => ({
      baselineRequirements: [...state.baselineRequirements, req],
    }))
  },

  updateBaselineRequirement: (id, updates) => {
    set((state) => {
      const baselineRequirements = state.baselineRequirements.map((req) => {
        if (req.id === id) {
          const updated = { ...req, ...updates }
          covrdDb.baselineRequirements.put(updated).catch(console.error)
          return updated
        }
        return req
      })
      return { baselineRequirements }
    })
  },

  removeBaselineRequirement: (id) => {
    covrdDb.baselineRequirements.delete(id).catch(console.error)
    set((state) => ({
      baselineRequirements: state.baselineRequirements.filter((req) => req.id !== id),
    }))
  },

  getRequirementsForDate: (date) => {
    const explicitOverrides = get().requirements.filter((req) => req.date === date)

    // REPLACE MODE: If any explicit requirements exist for this specific date, use them entirely.
    if (explicitOverrides.length > 0) {
      return explicitOverrides
    }

    // Otherwise, fall back to the Baseline requirements for this day of the week.
    // getDay() gives 0=Sun, 1=Mon. Our DayOfWeek mapping expects 0=Mon, 6=Sun.
    const d = new Date(`${date}T00:00:00`)
    const rawDay = d.getDay()
    const dayOfWeek = rawDay === 0 ? 6 : rawDay - 1

    const baselines = get().baselineRequirements.filter((req) => req.dayOfWeek === dayOfWeek)

    // Map the resolved baselines into structural CoverageRequirements dynamically
    // so downstream components are none-the-wiser.
    return baselines.map((baseline) => ({
      id: `${baseline.id}-${date}`, // Transient ID for the virtual overridden shift
      date: date,
      startTime: baseline.startTime,
      endTime: baseline.endTime,
      requiredStaff: baseline.requiredStaff,
      role: baseline.role,
      unpaidBreakMinutes: baseline.unpaidBreakMinutes,
    }))
  },

  reset: () => {
    set({ requirements: [], baselineRequirements: [] })
  },
}))
