import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTemplateStore } from './templateStore'
import type { RecurringTemplate } from '../types/index'

describe('useTemplateStore', () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    act(() => {
      useTemplateStore.getState().reset()
    })
  })

  it('should initialize with an empty template list', () => {
    const { result } = renderHook(() => useTemplateStore())
    expect(result.current.templates).toEqual([])
  })

  it('should add a new template', () => {
    const { result } = renderHook(() => useTemplateStore())

    // Stub definition
    const mockTemplate: Omit<RecurringTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'Summer Shift Loop',
      coverageRequirements: [],
      constraints: [],
      pattern: { kind: 'weekly' },
    }

    act(() => {
      result.current.addTemplate(mockTemplate)
    })

    expect(result.current.templates.length).toBe(1)
    expect(result.current.templates[0].name).toBe('Summer Shift Loop')
    expect(result.current.templates[0].id).toBeDefined()
    expect(result.current.templates[0].createdAt).toBeDefined()
    expect(result.current.templates[0].pattern.kind).toBe('weekly')
  })

  it('should be able to clone an existing template', () => {
    const { result } = renderHook(() => useTemplateStore())

    const mockTemplate: Omit<RecurringTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'Base Template',
      coverageRequirements: [
        {
          id: 'req1',
          name: 'Morning',
          day: 'monday',
          startTime: '09:00',
          endTime: '12:00',
          requiredStaff: 2,
        },
      ],
      constraints: [],
      pattern: { kind: 'biweekly', weekA: 'Red', weekB: 'Blue' },
    }

    act(() => {
      result.current.addTemplate(mockTemplate)
    })

    const sourceTemplate = result.current.templates[0]

    act(() => {
      result.current.cloneTemplate(sourceTemplate.id, 'Cloned Model')
    })

    expect(result.current.templates.length).toBe(2)
    const cloned = result.current.templates.find(
      (t: RecurringTemplate) => t.name === 'Cloned Model',
    )

    expect(cloned).toBeDefined()
    expect(cloned?.id).not.toBe(sourceTemplate.id)
    expect(cloned?.coverageRequirements[0].name).toBe('Morning') // Values copied
  })

  it('should delete a template', () => {
    const { result } = renderHook(() => useTemplateStore())
    act(() => {
      result.current.addTemplate({
        name: 'Trash Me',
        coverageRequirements: [],
        constraints: [],
        pattern: { kind: 'weekly' },
      })
    })

    const killTarget = result.current.templates[0].id

    act(() => {
      result.current.removeTemplate(killTarget)
    })

    expect(result.current.templates.length).toBe(0)
  })

  it('should update an existing template properties', () => {
    const { result } = renderHook(() => useTemplateStore())
    act(() => {
      result.current.addTemplate({
        name: 'Update Me',
        coverageRequirements: [],
        constraints: [],
        pattern: { kind: 'weekly' },
      })
    })

    const targetId = result.current.templates[0].id

    act(() => {
      result.current.updateTemplate(targetId, {
        name: 'Updated Complete',
        pattern: { kind: 'monthly', weekOfMonth: 1 },
      })
    })

    expect(result.current.templates[0].name).toBe('Updated Complete')
    expect(result.current.templates[0].pattern.kind).toBe('monthly')
    expect(result.current.templates[0].updatedAt).toBeDefined()
  })
})
