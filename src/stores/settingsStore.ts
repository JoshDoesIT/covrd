import { create } from 'zustand'
import type { AppSettings } from '../types/index'

const STORAGE_KEY = 'covrd-settings'

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  sidebarCollapsed: false,
  defaultView: 'grid',
  timeFormat: '12h',
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_SETTINGS
}

interface SettingsState extends AppSettings {
  /** Update one or more settings and persist to localStorage. */
  update: (patch: Partial<AppSettings>) => void
}

/**
 * useSettingsStore — persisted app settings.
 *
 * Stores user preferences (theme, time format, etc.) in localStorage.
 */
export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...loadSettings(),

  update: (patch) => {
    const next = { ...get(), ...patch }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    set(patch)
  },
}))
