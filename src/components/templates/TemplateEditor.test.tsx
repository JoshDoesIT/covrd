import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TemplateEditor } from './TemplateEditor'
import { useTemplateStore } from '../../stores/templateStore'
import { act } from 'react'
import userEvent from '@testing-library/user-event'

describe('TemplateEditor', () => {
  beforeEach(() => {
    act(() => {
      useTemplateStore.getState().reset()
      useTemplateStore.getState().addTemplate({
        name: 'Initial Model',
        coverageRequirements: [],
        constraints: [],
        pattern: { kind: 'weekly' },
      })
    })
  })

  it('renders nothing if no valid templateId matches', () => {
    const { container } = render(<TemplateEditor templateId="ghost" onBack={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('allows renaming the template', async () => {
    const targetId = useTemplateStore.getState().templates[0].id
    render(<TemplateEditor templateId={targetId} onBack={() => {}} />)

    const nameInput = screen.getByLabelText(/Template Name/i)
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Renamed Layout')

    const saveBtn = screen.getByRole('button', { name: /save/i })
    await userEvent.click(saveBtn)

    expect(useTemplateStore.getState().templates[0].name).toBe('Renamed Layout')
  })

  it('updates the recurrence pattern format properly to basic rotations', async () => {
    const targetId = useTemplateStore.getState().templates[0].id
    render(<TemplateEditor templateId={targetId} onBack={() => {}} />)

    const patternSelect = screen.getByLabelText(/Recursion Pattern/i)
    await userEvent.selectOptions(patternSelect, 'rotation')

    const saveBtn = screen.getByRole('button', { name: /save/i })
    await userEvent.click(saveBtn)

    const updated = useTemplateStore.getState().templates[0]
    expect(updated.pattern.kind).toBe('rotation')
  })

  it('triggers onBack when cancel is clicked', () => {
    const onBackSpy = vi.fn()
    const targetId = useTemplateStore.getState().templates[0].id
    render(<TemplateEditor templateId={targetId} onBack={onBackSpy} />)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onBackSpy).toHaveBeenCalledTimes(1)
  })
})
