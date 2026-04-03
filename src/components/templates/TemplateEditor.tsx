import { useState } from 'react'
import { useTemplateStore } from '../../stores/templateStore'
import type { RecurringTemplate, RecurrencePattern } from '../../types/index'
import './TemplateEditor.css'

interface TemplateEditorProps {
  templateId: string
  onBack: () => void
}

export function TemplateEditor({ templateId, onBack }: TemplateEditorProps) {
  const { templates, updateTemplate } = useTemplateStore()

  // Safe to initialize eagerly because parent sets key={templateId} forcing remount
  const [localTemplate, setLocalTemplate] = useState<RecurringTemplate | null>(
    templates.find((tmp) => tmp.id === templateId) || null,
  )

  if (!localTemplate) return null

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTemplate({ ...localTemplate, name: e.target.value })
  }

  const handlePatternChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as 'weekly' | 'biweekly' | 'rotation' | 'monthly'
    let newPattern: RecurrencePattern

    switch (val) {
      case 'biweekly':
        newPattern = { kind: 'biweekly', weekA: 'Week A', weekB: 'Week B' }
        break
      case 'rotation':
        newPattern = { kind: 'rotation', weeks: ['Cycle 1'], cycleLength: 1 }
        break
      case 'monthly':
        newPattern = { kind: 'monthly', weekOfMonth: 1 }
        break
      case 'weekly':
      default:
        newPattern = { kind: 'weekly' }
        break
    }

    setLocalTemplate({ ...localTemplate, pattern: newPattern })
  }

  const handleSave = () => {
    updateTemplate(templateId, {
      name: localTemplate.name,
      pattern: localTemplate.pattern,
    })
    onBack()
  }

  return (
    <div className="template-editor">
      <h2>Edit Template</h2>

      <div className="editor-form-group">
        <label htmlFor="tp-name">Template Name</label>
        <input id="tp-name" type="text" value={localTemplate.name} onChange={handleNameChange} />
      </div>

      <div className="editor-form-group">
        <label htmlFor="tp-pattern">Recursion Pattern</label>
        <select id="tp-pattern" value={localTemplate.pattern.kind} onChange={handlePatternChange}>
          <option value="weekly">Standard Weekly (Every Week)</option>
          <option value="biweekly">Bi-Weekly (Week A / Week B)</option>
          <option value="rotation">Custom Rotation Period</option>
          <option value="monthly">Monthly Fixed Week</option>
        </select>
      </div>

      <div className="editor-actions">
        <button onClick={onBack} className="action-btn">
          Cancel
        </button>
        <button onClick={handleSave} className="action-btn primary">
          Save
        </button>
      </div>
    </div>
  )
}
