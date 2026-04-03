import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import {
  Calendar,
  Users,
  Briefcase,
  Activity,
  Settings,
  RefreshCcw,
  Zap,
  Trash2,
  Shield,
} from 'lucide-react'
import { useScheduleStore } from '../../stores/scheduleStore'
import { useEmployeeStore } from '../../stores/employeeStore'
import { useCoverageStore } from '../../stores/coverageStore'
import { loadDemoData } from '../../data/demoData'
import { auditPrivacy } from '../../utils/privacyAudit'
import { DataPurge } from '../settings/DataPurge'
import './CommandPalette.css'

interface CommandPaletteProps {
  onNavigate: (view: string) => void
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

/**
 * CommandPalette — Global ⌘K command menu.
 *
 * Provides navigation, scheduling actions, demo data loading,
 * data purge, and privacy audit commands.
 *
 * Uses cmdk v1 which wraps Radix UI Dialog internally.
 * - `overlayClassName` targets the backdrop overlay `[cmdk-overlay]`
 * - `contentClassName` targets the dialog content `[cmdk-dialog]`
 */
export function CommandPalette({ onNavigate, open, setOpen }: CommandPaletteProps) {
  const [showPurge, setShowPurge] = useState(false)
  const { enableSandbox, commitSandbox, discardSandbox, isSandboxMode } = useScheduleStore()

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [setOpen])

  const handleAction = (action: string) => {
    setOpen(false)
    if (action.startsWith('nav_')) {
      onNavigate(action.replace('nav_', ''))
    } else if (action === 'action_sandbox') {
      if (isSandboxMode) discardSandbox()
      else enableSandbox()
    } else if (action === 'action_commit_sandbox') {
      if (isSandboxMode) commitSandbox()
    } else if (action === 'action_load_demo') {
      const { employees, coverageRequirements, schedule } = loadDemoData()
      employees.forEach((e) => useEmployeeStore.getState().addEmployee(e))
      coverageRequirements.forEach((r) => useCoverageStore.getState().addRequirement(r))
      useScheduleStore.getState().setActiveSchedule(schedule)
    } else if (action === 'action_purge') {
      setShowPurge(true)
    } else if (action === 'action_privacy_audit') {
      const report = auditPrivacy()
      console.log(report.formatted)
    }
  }

  return (
    <>
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Global Command Menu"
        overlayClassName="covrd-command-overlay"
        contentClassName="covrd-command-dialog"
      >
        <Command.Input placeholder="Type a command or search..." className="covrd-command-input" />
        <Command.List className="covrd-command-list">
          <Command.Empty className="covrd-command-empty">No results found.</Command.Empty>

          <Command.Group heading="Navigation">
            <Command.Item
              onSelect={() => handleAction('nav_employees')}
              className="covrd-command-item"
            >
              <Users size={18} />
              Go to Employee Roster
            </Command.Item>
            <Command.Item
              onSelect={() => handleAction('nav_coverage')}
              className="covrd-command-item"
            >
              <Briefcase size={18} />
              Go to Coverage Rules
            </Command.Item>
            <Command.Item
              onSelect={() => handleAction('nav_schedule')}
              className="covrd-command-item"
            >
              <Calendar size={18} />
              Go to Schedule Builder
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Actions">
            <Command.Item
              onSelect={() => handleAction('nav_schedule')}
              className="covrd-command-item"
            >
              <Activity size={18} />
              Run Schedule Generator
            </Command.Item>
            <Command.Item
              onSelect={() => handleAction('action_sandbox')}
              className="covrd-command-item"
            >
              <RefreshCcw size={18} />
              Toggle Sandbox Mode
            </Command.Item>
            {isSandboxMode && (
              <Command.Item
                onSelect={() => handleAction('action_commit_sandbox')}
                className="covrd-command-item"
              >
                <RefreshCcw size={18} />
                Commit Sandbox Changes
              </Command.Item>
            )}
            <Command.Item
              onSelect={() => handleAction('action_load_demo')}
              className="covrd-command-item"
            >
              <Zap size={18} />
              Load Demo Data
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Settings">
            <Command.Item
              onSelect={() => handleAction('action_privacy_audit')}
              className="covrd-command-item"
            >
              <Shield size={18} />
              Run Privacy Audit
            </Command.Item>
            <Command.Item
              onSelect={() => handleAction('action_purge')}
              className="covrd-command-item"
            >
              <Trash2 size={18} color="var(--color-danger)" />
              Purge All Data
            </Command.Item>
            <Command.Item
              onSelect={() => handleAction('nav_settings')}
              className="covrd-command-item"
            >
              <Settings size={18} />
              Preferences
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command.Dialog>

      {showPurge && <DataPurge onClose={() => setShowPurge(false)} />}
    </>
  )
}
