import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { Calendar, Users, Briefcase, Activity, Settings, RefreshCcw } from 'lucide-react'
import { useScheduleStore } from '../../stores/scheduleStore'
import './CommandPalette.css'

interface CommandPaletteProps {
  onNavigate: (view: string) => void
}

export function CommandPalette({ onNavigate }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const { enableSandbox, commitSandbox, discardSandbox, isSandboxMode } = useScheduleStore()

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleAction = (action: string) => {
    setOpen(false)
    if (action.startsWith('nav_')) {
      onNavigate(action.replace('nav_', ''))
    } else if (action === 'action_sandbox') {
      if (isSandboxMode) discardSandbox()
      else enableSandbox()
    } else if (action === 'action_commit_sandbox') {
      if (isSandboxMode) commitSandbox()
    }
  }

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Global Command Menu" className="covrd-command-dialog">
      <Command.Input placeholder="Type a command or search..." className="covrd-command-input" />
      <Command.List className="covrd-command-list">
        <Command.Empty className="covrd-command-empty">No results found.</Command.Empty>

        <Command.Group heading="Navigation">
          <Command.Item onSelect={() => handleAction('nav_employees')} className="covrd-command-item">
            <Users className="w-4 h-4 mr-2" />
            Go to Employee Roster
          </Command.Item>
          <Command.Item onSelect={() => handleAction('nav_coverage')} className="covrd-command-item">
            <Briefcase className="w-4 h-4 mr-2" />
            Go to Coverage Rules
          </Command.Item>
          <Command.Item onSelect={() => handleAction('nav_schedule')} className="covrd-command-item">
            <Calendar className="w-4 h-4 mr-2" />
            Go to Schedule Builder
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Actions">
          <Command.Item onSelect={() => handleAction('nav_schedule')} className="covrd-command-item">
            <Activity className="w-4 h-4 mr-2 text-primary" />
            Run Schedule Generator
          </Command.Item>
          <Command.Item onSelect={() => handleAction('action_sandbox')} className="covrd-command-item">
            <RefreshCcw className="w-4 h-4 mr-2 text-warning" />
            Toggle Sandbox Mode
          </Command.Item>
          {isSandboxMode && (
            <Command.Item onSelect={() => handleAction('action_commit_sandbox')} className="covrd-command-item">
              <RefreshCcw className="w-4 h-4 mr-2 text-success" />
              Commit Sandbox Changes
            </Command.Item>
          )}
        </Command.Group>

        <Command.Group heading="Settings">
          <Command.Item onSelect={() => handleAction('nav_settings')} className="covrd-command-item">
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}
