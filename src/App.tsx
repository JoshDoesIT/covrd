import { useEffect, useState } from 'react'
import { AppShell } from './components/AppShell'
import { OnboardingWizard } from './components/onboarding/OnboardingWizard'
import { hydrateFromHash } from './stores/urlState'
import { useScheduleStore } from './stores/scheduleStore'
import { useEmployeeStore } from './stores/employeeStore'
import { useCoverageStore } from './stores/coverageStore'
import { covrdDb } from './db/db'
import { LandingPage } from './components/landing/LandingPage'
import { PolicyModal } from './components/shared/PolicyModal'
import { Toast } from './components/tooling/Toast'

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
    () => window.location.search.includes('app') || window.location.hash.includes('app'),
  )
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem(ONBOARDING_KEY) !== 'true',
  )
  const [isLoading, setIsLoading] = useState(true)
  const [policyModal, setPolicyModal] = useState<'privacy' | 'accessibility' | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const applySharedState = async (sharedState: any) => {
    // 1. Wipe existing state completely
    await covrdDb.purgeAll()

    // 2. Clear out Zustand states cleanly
    useEmployeeStore.getState().hydrate([])
    useCoverageStore.getState().reset()
    useScheduleStore.getState().hydrate([]) // Clear any previous schedules

    // 3. Import data into Zustand (this will natively rewrite to IDB via store methods)
    sharedState.employees.forEach((e: any) => useEmployeeStore.getState().addEmployee(e))
    sharedState.coverageRequirements.forEach((r: any) =>
      useCoverageStore.getState().addRequirement(r),
    )
    if (sharedState.baselineRequirements) {
      sharedState.baselineRequirements.forEach((b: any) =>
        useCoverageStore.getState().addBaselineRequirement(b),
      )
    }
    useScheduleStore.getState().setActiveSchedule(sharedState.schedule)
  }

  useEffect(() => {
    async function initData() {
      // First, try loading shared state from URL hash
      const sharedState = hydrateFromHash()
      if (sharedState) {
        await applySharedState(sharedState)
        window.history.replaceState(null, '', window.location.pathname)
      } else {
        // Otherwise, hydrate from local IndexedDB
        const [employees, reqs, baselines, schedules] = await Promise.all([
          covrdDb.employees.toArray(),
          covrdDb.coverageRequirements.toArray(),
          covrdDb.baselineRequirements.toArray(),
          covrdDb.schedules.toArray(),
        ])

        useEmployeeStore.getState().hydrate(employees)
        useCoverageStore.getState().hydrate(reqs, baselines)
        useScheduleStore.getState().hydrate(schedules)
      }
      setIsLoading(false)
    }

    initData()
  }, [])

  useEffect(() => {
    const onLaunchTutorial = () => setShowOnboarding(true)
    window.addEventListener('launch-tutorial', onLaunchTutorial)

    // Listen for dynamically pasted share links (so users don't have to refresh)
    const onGlobalHashChange = async () => {
      const sharedState = hydrateFromHash()
      if (sharedState) {
        await applySharedState(sharedState)
        setToastMessage('Successfully loaded data!')
        window.history.replaceState(null, '', window.location.pathname)
      }
    }
    window.addEventListener('hashchange', onGlobalHashChange)

    return () => {
      window.removeEventListener('launch-tutorial', onLaunchTutorial)
      window.removeEventListener('hashchange', onGlobalHashChange)
    }
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
          onLaunch={() => {
            window.location.hash = 'app'
            setIsAppLaunched(true)
          }}
          onShowPrivacy={() => setPolicyModal('privacy')}
          onShowAccessibility={() => setPolicyModal('accessibility')}
        />
        <PolicyModal type={policyModal} onClose={() => setPolicyModal(null)} />
      </>
    )
  }

  return (
    <>
      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} duration={4000} type="success" />
      )}
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}
      <AppShell />
      {/* AppShell handles its own PolicyModal for the footer links, but we can also use a global one.
          Actually AppShell has its own state. So we don't need PolicyModal here for the app side. */}
    </>
  )
}
