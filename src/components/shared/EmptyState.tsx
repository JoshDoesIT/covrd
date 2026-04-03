import type { ReactNode } from 'react'
import './EmptyState.css'

/**
 * EmptyState — Reusable placeholder for views with no data.
 *
 * Displays a centered icon, title, description, and optional CTA button.
 * Used across Employees, Coverage, Schedule, and Templates views.
 */
interface EmptyStateProps {
  /** Icon element (e.g., a Lucide icon). */
  icon?: ReactNode
  /** Main heading. */
  title: string
  /** Supporting description text. */
  description: string
  /** Label for the call-to-action button. */
  ctaLabel?: string
  /** Click handler for the CTA button. */
  onCtaClick?: () => void
}

export function EmptyState({ icon, title, description, ctaLabel, onCtaClick }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      {icon && <div className="empty-state__icon">{icon}</div>}
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__description">{description}</p>
      {ctaLabel && onCtaClick && (
        <button className="empty-state__cta" onClick={onCtaClick}>
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
