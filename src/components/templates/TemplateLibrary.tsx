import { useTemplateStore } from '../../stores/templateStore'
import './TemplateLibrary.css'

interface TemplateLibraryProps {
  onEdit?: (templateId: string) => void
  onApply?: (templateId: string) => void
}

export function TemplateLibrary({ onEdit, onApply }: TemplateLibraryProps) {
  const { templates, removeTemplate, cloneTemplate, addTemplate } = useTemplateStore()

  const handleCreateNew = () => {
    // Generate a basic empty form
    addTemplate({
      name: 'New Blank Template',
      coverageRequirements: [],
      constraints: [],
      pattern: { kind: 'weekly' },
    })
  }

  if (templates.length === 0) {
    return (
      <div className="template-library empty">
        <p>No templates saved.</p>
        <button onClick={handleCreateNew} className="action-btn">
          Create New Template
        </button>
      </div>
    )
  }

  return (
    <div className="template-library">
      <div className="template-header">
        <h2>Saved Templates</h2>
        <button onClick={handleCreateNew} className="action-btn primary">
          + New Template
        </button>
      </div>

      <div className="template-grid">
        {templates.map((t) => (
          <div key={t.id} className="template-card">
            <div className="template-card-header">
              <h3>{t.name}</h3>
              <span className="template-badge">{t.pattern.kind}</span>
            </div>

            <div className="template-card-details">
              <p>{t.coverageRequirements.length} specific requirements</p>
              <p>Last modified: {new Date(t.updatedAt).toLocaleDateString()}</p>
            </div>

            <div className="template-card-actions">
              {onApply && (
                <button
                  onClick={() => onApply(t.id)}
                  className="action-btn"
                  aria-label="apply template"
                >
                  Use
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(t.id)}
                  className="action-btn"
                  aria-label="edit template"
                >
                  Edit
                </button>
              )}
              <button
                onClick={() => cloneTemplate(t.id, `${t.name} (Copy)`)}
                className="action-btn"
                aria-label="clone template"
              >
                Clone
              </button>
              <button
                onClick={() => removeTemplate(t.id)}
                className="action-btn template-btn-delete"
                aria-label="delete template"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
