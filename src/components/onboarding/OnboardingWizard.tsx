import { useState } from 'react'
import { Sparkles, Users, CalendarDays, CheckCircle, ChevronRight, Zap } from 'lucide-react'
import { useEmployeeStore } from '../../stores/employeeStore'
import { useCoverageStore } from '../../stores/coverageStore'
import { useScheduleStore } from '../../stores/scheduleStore'
import { loadDemoData } from '../../data/demoData'
import './OnboardingWizard.css'

/**
 * OnboardingWizard — First-run guided setup for new users.
 *
 * A 4-step wizard that introduces the app and optionally loads demo data.
 * Shown only on first launch (tracked via localStorage).
 */
interface OnboardingWizardProps {
  /** Called when the wizard is completed or skipped. */
  onComplete: () => void
}

const STEPS = [
  {
    key: 'welcome',
    icon: Sparkles,
    title: 'Welcome to Covrd',
    description:
      'Your privacy-first staff scheduling tool. Everything runs in your browser — no servers, no tracking, no data ever leaves your device.',
    cta: 'Get Started',
  },
  {
    key: 'employees',
    icon: Users,
    title: 'Add Employees',
    description:
      'Start by adding your team members with their roles, availability, and hour preferences. You can also load demo data to explore the app first.',
    cta: 'Next',
  },
  {
    key: 'coverage',
    icon: CalendarDays,
    title: 'Set Coverage',
    description:
      'Define when you need staff and how many. Set morning, afternoon, and evening shifts for each day of the week.',
    cta: 'Next',
  },
  {
    key: 'ready',
    icon: CheckCircle,
    title: 'Ready to Go!',
    description:
      'Hit "Automagic Schedule" in the Schedule view to generate an optimized schedule that respects all your constraints. Edit, share, and export from there.',
    cta: 'Start Scheduling',
  },
]

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const step = STEPS[currentStep]
  const StepIcon = step.icon
  const isLast = currentStep === STEPS.length - 1

  const handleNext = () => {
    if (isLast) {
      onComplete()
    } else {
      setCurrentStep((s) => s + 1)
    }
  }

  const handleLoadDemo = () => {
    const { employees, coverageRequirements, schedule } = loadDemoData()
    employees.forEach((e) => useEmployeeStore.getState().addEmployee(e))
    coverageRequirements.forEach((r) => useCoverageStore.getState().addRequirement(r))
    useScheduleStore.getState().setActiveSchedule(schedule)
    setCurrentStep(STEPS.length - 1) // Jump to final step
  }

  return (
    <div className="onboarding__overlay">
      <div className="onboarding__card">
        <div className="onboarding__progress">
          <span className="onboarding__step-label">Step {currentStep + 1} of {STEPS.length}</span>
          <div className="onboarding__progress-bar">
            <div
              className="onboarding__progress-fill"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="onboarding__content">
          <div className="onboarding__icon-wrapper">
            <StepIcon size={48} strokeWidth={1.5} />
          </div>
          <h2 className="onboarding__title">{step.title}</h2>
          <p className="onboarding__description">{step.description}</p>
        </div>

        <div className="onboarding__actions">
          <button
            className="onboarding__btn onboarding__btn--ghost"
            onClick={onComplete}
            aria-label="Skip"
          >
            Skip
          </button>

          <div className="onboarding__actions-right">
            {currentStep === 1 && (
              <button
                className="onboarding__btn onboarding__btn--demo"
                onClick={handleLoadDemo}
                aria-label="Load Demo"
              >
                <Zap size={14} /> Load Demo
              </button>
            )}
            <button
              className="onboarding__btn onboarding__btn--primary"
              onClick={handleNext}
              aria-label={step.cta}
            >
              {step.cta} {!isLast && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
