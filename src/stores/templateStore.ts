import { create } from 'zustand'
import type { RecurringTemplate } from '../types/index'
import { covrdDb } from '../db/db'

interface TemplateState {
  templates: RecurringTemplate[]
  hydrate: (templates: RecurringTemplate[]) => void
  addTemplate: (template: Omit<RecurringTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void
  removeTemplate: (id: string) => void
  updateTemplate: (
    id: string,
    updates: Partial<Omit<RecurringTemplate, 'id' | 'createdAt' | 'updatedAt'>>,
  ) => void
  cloneTemplate: (sourceId: string, cloneName: string) => void
  reset: () => void
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],

  hydrate: (templates) => {
    set({ templates })
  },

  addTemplate: (templateData) => {
    const now = new Date().toISOString()
    const newTemplate: RecurringTemplate = {
      ...templateData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }

    covrdDb.templates.put(newTemplate).catch(console.error)

    set((state) => ({
      templates: [...state.templates, newTemplate],
    }))
  },

  removeTemplate: (id) => {
    covrdDb.templates.delete(id).catch(console.error)
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    }))
  },

  updateTemplate: (id, updates) => {
    set((state) => {
      const templates = state.templates.map((t) => {
        if (t.id === id) {
          const updated = {
            ...t,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
          covrdDb.templates.put(updated).catch(console.error)
          return updated
        }
        return t
      })
      return { templates }
    })
  },

  cloneTemplate: (sourceId, cloneName) => {
    const sourceLine = get().templates.find((t) => t.id === sourceId)
    if (!sourceLine) return

    const now = new Date().toISOString()

    // Deep clone properties via JSON to break references
    const newRequirements = JSON.parse(JSON.stringify(sourceLine.coverageRequirements))
    const newConstraints = JSON.parse(JSON.stringify(sourceLine.constraints))
    const newPattern = JSON.parse(JSON.stringify(sourceLine.pattern))

    const clone: RecurringTemplate = {
      id: crypto.randomUUID(),
      name: cloneName,
      coverageRequirements: newRequirements,
      constraints: newConstraints,
      pattern: newPattern,
      createdAt: now,
      updatedAt: now,
    }

    covrdDb.templates.put(clone).catch(console.error)

    set((state) => ({
      templates: [...state.templates, clone],
    }))
  },

  reset: () => {
    set({ templates: [] })
  },
}))
