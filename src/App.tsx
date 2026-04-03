import { useEffect, useState } from 'react'
import { AppShell } from './components/AppShell'
import { OnboardingWizard } from './components/onboarding/OnboardingWizard'
import { hydrateFromHash } from './stores/urlState'
import { useScheduleStore } from './stores/scheduleStore'
import { useEmployeeStore } from './stores/employeeStore'
import { useCoverageStore } from './stores/coverageStore'
import { useTemplateStore } from './stores/templateStore'
import { covrdDb } from './db/db'
import { LandingPage } from './components/landing/LandingPage'
import { PolicyModal } from './components/shared/PolicyModal'

/** LocalStorage key for tracking onboarding completion. */
const ONBOARDING_KEY = 'covrd-onboarding-complete'

/**
 * Root application component for Covrd.
 *
 * On first launch, displays the onboarding wizard.
 * On subsequent launches, renders the AppShell directly.
 * Also checks the URL hash for shared state to hydrate.
 */
export function App() {
  const [isAppLaunched, setIsAppLaunched] = useState(
    () => window.location.search.includes('app') || localStorage.getItem(ONBOARDING_KEY) === 'true',
  )
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem(ONBOARDING_KEY) !== 'true',
  )
  const [isLoading, setIsLoading] = useState(true)
  const [policyModal, setPolicyModal] = useState<'privacy' | 'accessibility' | null>(null)

  useEffect(() => {
    async function initData() {
      // First, try loading shared state from URL hash
      const sharedState = hydrateFromHash()
      if (sharedState) {
        sharedState.employees.forEach((e) => useEmployeeStore.getState().addEmployee(e))
        sharedState.coverageRequirements.forEach((r) =>
          useCoverageStore.getState().addRequirement(r),
        )
        useScheduleStore.getState().setActiveSchedule(sharedState.schedule)
        window.history.replaceState(null, '', window.location.pathname)
      } else {
        // Otherwise, hydrate from local IndexedDB
        const [employees, reqs, schedules, templates] = await Promise.all([
          covrdDb.employees.toArray(),
          covrdDb.coverageRequirements.toArray(),
          covrdDb.schedules.toArray(),
          covrdDb.templates.toArray(),
        ])

        useEmployeeStore.getState().hydrate(employees)
        useCoverageStore.getState().hydrate(reqs)
        useScheduleStore.getState().hydrate(schedules)
        useTemplateStore.getState().hydrate(templates)
      }
      setIsLoading(false)
    }

    initData()
  }, [])

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setShowOnboarding(false)
  }

  if (isLoading) return null // Hide shell until data hydrates

  // Show Landing Page if not launched yet
  if (!isAppLaunched) {
    return (
      <>
        <LandingPage
          onLaunch={() => setIsAppLaunched(true)}
          onShowPrivacy={() => setPolicyModal('privacy')}
        />
        <PolicyModal type={policyModal} onClose={() => setPolicyModal(null)} />
      </>
    )
  }

  return (
    <>
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}
      <AppShell />
      {/* AppShell handles its own PolicyModal for the footer links, but we can also use a global one.
          Actually AppShell has its own state. So we don't need PolicyModal here for the app side. */}
    </>
  )
}
