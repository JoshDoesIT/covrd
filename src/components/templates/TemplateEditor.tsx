import { useState } from 'react'
import { useTemplateStore } from '../../stores/templateStore'
import type { RecurringTemplate, RecurrencePattern } from '../../types/index'
import './TemplateEditor.css'

interface TemplateEditorProps {
  templateId: string
  onBack: () => void
}

const PATTERN_INFO: Record<string, { label: string; description: string }> = {
  weekly: {
    label: 'Standard Weekly',
    description: 'The same schedule repeats every week. Best for consistent, predictable staffing.',
  },
  biweekly: {
    label: 'Bi-Weekly (A/B)',
    description:
      'Alternates between two distinct week patterns. Great for rotating weekends or staggering workloads.',
  },
  rotation: {
    label: 'Custom Rotation',
    description:
      'A multi-week cycle that repeats after a set number of weeks. Ideal for shift rotations across teams.',
  },
  monthly: {
    label: 'Monthly Fixed Week',
    description:
      'Targets a specific week of the month (1st, 2nd, 3rd, or 4th). Useful for monthly on-call or review duties.',
  },
}

/**
 * TemplateEditor — Edit form for a single RecurringTemplate.
 * Displays pattern-specific configuration fields based on the selected recurrence type.
 */
export function TemplateEditor({ templateId, onBack }: TemplateEditorProps) {
  const { templates, updateTemplate } = useTemplateStore()

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
        newPattern = { kind: 'rotation', weeks: ['Cycle 1', 'Cycle 2'], cycleLength: 2 }
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

  const updatePatternField = (updates: Partial<RecurrencePattern>) => {
    setLocalTemplate({
      ...localTemplate,
      pattern: { ...localTemplate.pattern, ...updates } as RecurrencePattern,
    })
  }

  const handleSave = () => {
    updateTemplate(templateId, {
      name: localTemplate.name,
      pattern: localTemplate.pattern,
    })
    onBack()
  }

  const patternKind = localTemplate.pattern.kind
  const patternMeta = PATTERN_INFO[patternKind]

  return (
    <div className="template-editor">
      <h2>Edit Template</h2>

      <div className="editor-form-group">
        <label htmlFor="tp-name">Template Name</label>
        <input id="tp-name" type="text" value={localTemplate.name} onChange={handleNameChange} />
      </div>

      <div className="editor-form-group">
        <label htmlFor="tp-pattern">Recurrence Pattern</label>
        <select id="tp-pattern" value={patternKind} onChange={handlePatternChange}>
          {Object.entries(PATTERN_INFO).map(([key, info]) => (
            <option key={key} value={key}>
              {info.label}
            </option>
          ))}
        </select>
        {patternMeta && <p className="pattern-description">{patternMeta.description}</p>}
      </div>

      {/* -- Pattern-specific configuration -- */}
      {patternKind === 'biweekly' && localTemplate.pattern.kind === 'biweekly' && (
        <fieldset className="pattern-config">
          <legend>Bi-Weekly Settings</legend>
          <div className="pattern-config-row">
            <div className="editor-form-group">
              <label htmlFor="tp-weekA">Week A Label</label>
              <input
                id="tp-weekA"
                type="text"
                value={localTemplate.pattern.weekA}
                onChange={(e) =>
                  updatePatternField({ weekA: e.target.value } as Partial<RecurrencePattern>)
                }
              />
            </div>
            <div className="editor-form-group">
              <label htmlFor="tp-weekB">Week B Label</label>
              <input
                id="tp-weekB"
                type="text"
                value={localTemplate.pattern.weekB}
                onChange={(e) =>
                  updatePatternField({ weekB: e.target.value } as Partial<RecurrencePattern>)
                }
              />
            </div>
          </div>
        </fieldset>
      )}

      {patternKind === 'rotation' && localTemplate.pattern.kind === 'rotation' && (
        <fieldset className="pattern-config">
          <legend>Rotation Settings</legend>
          <div className="editor-form-group">
            <label htmlFor="tp-cycle">Cycle Length (weeks)</label>
            <input
              id="tp-cycle"
              type="number"
              min={1}
              max={12}
              value={localTemplate.pattern.cycleLength}
              onChange={(e) => {
                const len = Math.max(1, Number(e.target.value))
                const currentWeeks =
                  localTemplate.pattern.kind === 'rotation' ? localTemplate.pattern.weeks : []
                const weeks = Array.from(
                  { length: len },
                  (_, i) => currentWeeks[i] || `Cycle ${i + 1}`,
                )
                updatePatternField({ cycleLength: len, weeks } as Partial<RecurrencePattern>)
              }}
            />
          </div>
          <div className="editor-form-group">
            <label>Cycle Labels</label>
            <div className="cycle-labels">
              {localTemplate.pattern.weeks.map((week, i) => (
                <input
                  key={i}
                  type="text"
                  value={week}
                  placeholder={`Week ${i + 1}`}
                  onChange={(e) => {
                    if (localTemplate.pattern.kind === 'rotation') {
                      const weeks = [...localTemplate.pattern.weeks]
                      weeks[i] = e.target.value
                      updatePatternField({ weeks } as Partial<RecurrencePattern>)
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </fieldset>
      )}

      {patternKind === 'monthly' && localTemplate.pattern.kind === 'monthly' && (
        <fieldset className="pattern-config">
          <legend>Monthly Settings</legend>
          <div className="editor-form-group">
            <label htmlFor="tp-weekOfMonth">Week of Month</label>
            <select
              id="tp-weekOfMonth"
              value={localTemplate.pattern.weekOfMonth}
              onChange={(e) =>
                updatePatternField({
                  weekOfMonth: Number(e.target.value),
                } as Partial<RecurrencePattern>)
              }
            >
              <option value={1}>1st week</option>
              <option value={2}>2nd week</option>
              <option value={3}>3rd week</option>
              <option value={4}>4th week</option>
            </select>
          </div>
        </fieldset>
      )}

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
