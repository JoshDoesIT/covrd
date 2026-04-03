import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'
import type { RecurringTemplate } from '../types/index'

/**
 * Custom storage engine utilizing IndexedDB via idb-keyval.
 * Ensures that large template arrays do not aggressively hit LocalStorage quota.
 * Safely falls back to a dummy memory store in Test environments (JSDOM).
 */
const idbStorageWrapper: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof indexedDB === 'undefined') return null
    return (await get(name)) || null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof indexedDB === 'undefined') return
    await set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof indexedDB === 'undefined') return
    await del(name)
  },
}

interface TemplateState {
  templates: RecurringTemplate[]
  addTemplate: (template: Omit<RecurringTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void
  removeTemplate: (id: string) => void
  updateTemplate: (
    id: string,
    updates: Partial<Omit<RecurringTemplate, 'id' | 'createdAt' | 'updatedAt'>>,
  ) => void
  cloneTemplate: (sourceId: string, cloneName: string) => void
  reset: () => void
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, getFn) => ({
      templates: [],

      addTemplate: (templateData) => {
        const now = new Date().toISOString()
        const newTemplate: RecurringTemplate = {
          ...templateData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        }

        set((state) => ({
          templates: [...state.templates, newTemplate],
        }))
      },

      removeTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }))
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((t) => {
            if (t.id === id) {
              return {
                ...t,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            }
            return t
          }),
        }))
      },

      cloneTemplate: (sourceId, cloneName) => {
        const sourceLine = getFn().templates.find((t) => t.id === sourceId)
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

        set((state) => ({
          templates: [...state.templates, clone],
        }))
      },

      reset: () => {
        set({ templates: [] })
      },
    }),
    {
      name: 'covrd-templates',
      storage: createJSONStorage(() => idbStorageWrapper),
    },
  ),
)
