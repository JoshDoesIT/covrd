import { useEffect } from 'react'
import { AppShell } from './components/AppShell'
import { hydrateFromHash } from './stores/urlState'
import { useScheduleStore } from './stores/scheduleStore'
import { useEmployeeStore } from './stores/employeeStore'
import { useCoverageStore } from './stores/coverageStore'

/**
 * Root application component for Covrd.
 *
 * Renders the AppShell layout with sidebar navigation,
 * header bar, and main content area.
 *
 * On mount, checks the URL hash fragment for shared state
 * and hydrates all stores if valid data is found.
 */
export function App() {
  useEffect(() => {
    const state = hydrateFromHash()
    if (state) {
      // Hydrate all stores from the shared URL
      state.employees.forEach((e) => useEmployeeStore.getState().addEmployee(e))
      state.coverageRequirements.forEach((r) => useCoverageStore.getState().addRequirement(r))
      useScheduleStore.getState().setActiveSchedule(state.schedule)

      // Clear the hash so a refresh doesn't re-hydrate
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  return <AppShell />
}
