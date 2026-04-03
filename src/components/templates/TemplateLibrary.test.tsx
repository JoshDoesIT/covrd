import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TemplateLibrary } from './TemplateLibrary'
import { useTemplateStore } from '../../stores/templateStore'
import { act } from 'react'

describe('TemplateLibrary', () => {
  beforeEach(() => {
    act(() => {
      useTemplateStore.getState().reset()
    })
  })

  it('renders empty state when no templates exist', () => {
    render(<TemplateLibrary />)
    expect(screen.getByText(/No templates saved/i)).toBeInTheDocument()
  })

  it('renders a list of available templates', () => {
    act(() => {
      useTemplateStore.getState().addTemplate({
        name: 'Summer Rush',
        coverageRequirements: [],
        constraints: [],
        pattern: { kind: 'weekly' },
      })
    })

    render(<TemplateLibrary />)
    expect(screen.getByText('Summer Rush')).toBeInTheDocument()
    expect(screen.getByText(/weekly/i)).toBeInTheDocument() // Shows the pattern
  })

  it('allows deleting a template', () => {
    act(() => {
      useTemplateStore.getState().addTemplate({
        name: 'Delete Me',
        coverageRequirements: [],
        constraints: [],
        pattern: { kind: 'weekly' },
      })
    })

    render(<TemplateLibrary />)
    const deleteBtn = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteBtn)

    expect(screen.queryByText('Delete Me')).not.toBeInTheDocument()
  })

  it('triggers an edit callback when edit layout clicked', () => {
    const onEditSpy = vi.fn()
    act(() => {
      useTemplateStore.getState().addTemplate({
        name: 'Edit Me',
        coverageRequirements: [],
        constraints: [],
        pattern: { kind: 'weekly' },
      })
    })

    render(<TemplateLibrary onEdit={onEditSpy} />)
    const editBtn = screen.getByRole('button', { name: /edit/i })
    fireEvent.click(editBtn)

    expect(onEditSpy).toHaveBeenCalledTimes(1)
    expect(onEditSpy).toHaveBeenCalledWith(expect.any(String)) // Should pass the template ID
  })

  it('clones a template inline', () => {
    act(() => {
      useTemplateStore.getState().addTemplate({
        name: 'Origin Form',
        coverageRequirements: [],
        constraints: [],
        pattern: { kind: 'monthly', weekOfMonth: 2 },
      })
    })

    render(<TemplateLibrary />)
    const cloneBtn = screen.getByRole('button', { name: /clone/i })
    fireEvent.click(cloneBtn)

    // A prompt or direct clone is fine. Assume direct clone adds "(Copy)"
    expect(screen.getByText('Origin Form (Copy)')).toBeInTheDocument()
    expect(useTemplateStore.getState().templates.length).toBe(2)
  })
})
