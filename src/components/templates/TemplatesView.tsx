import { useState } from 'react'
import { TemplateLibrary } from './TemplateLibrary'
import { TemplateEditor } from './TemplateEditor'
import { useScheduleStore } from '../../stores/scheduleStore'

export function TemplatesView({ onNavigate }: { onNavigate?: (nav: string) => void }) {
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const { setPendingTemplateId } = useScheduleStore()

  if (editingTemplateId) {
    return (
      <TemplateEditor 
        key={editingTemplateId}
        templateId={editingTemplateId} 
        onBack={() => setEditingTemplateId(null)} 
      />
    )
  }

  return (
    <TemplateLibrary
      onEdit={setEditingTemplateId}
      onApply={(id) => {
        setPendingTemplateId(id)
        if (onNavigate) onNavigate('schedule')
      }}
    />
  )
}
