import { describe, it, expect } from 'vitest'
import { serializeTemplatesJSON, deserializeTemplatesJSON } from './exportTemplates'
import { createRecurringTemplate } from '../types/factories'

describe('Template Export/Import Utilities (Story 6.10)', () => {
  const templates = [
    createRecurringTemplate({
      id: 't1',
      name: 'Summer Schedule',
      pattern: { kind: 'weekly' },
      coverageRequirements: [],
      constraints: [],
    }),
    createRecurringTemplate({
      id: 't2',
      name: 'Rotation Plan',
      pattern: { kind: 'rotation', weeks: ['A', 'B'], cycleLength: 2 },
      coverageRequirements: [],
      constraints: [],
    }),
  ]

  describe('serializeTemplatesJSON', () => {
    it('serializes a template array to JSON with metadata', () => {
      const json = serializeTemplatesJSON(templates)
      const parsed = JSON.parse(json)

      expect(parsed.version).toBe(1)
      expect(parsed.exportedAt).toBeDefined()
      expect(parsed.templates).toHaveLength(2)
      expect(parsed.templates[0].name).toBe('Summer Schedule')
    })

    it('handles an empty templates array', () => {
      const json = serializeTemplatesJSON([])
      const parsed = JSON.parse(json)

      expect(parsed.templates).toHaveLength(0)
    })
  })

  describe('deserializeTemplatesJSON', () => {
    it('round-trips through serialize/deserialize', () => {
      const json = serializeTemplatesJSON(templates)
      const result = deserializeTemplatesJSON(json)

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Summer Schedule')
      expect(result[1].pattern.kind).toBe('rotation')
    })

    it('throws on invalid JSON', () => {
      expect(() => deserializeTemplatesJSON('bad')).toThrow()
    })

    it('throws when templates is not an array', () => {
      const bad = JSON.stringify({ templates: 'nope' })
      expect(() => deserializeTemplatesJSON(bad)).toThrow()
    })

    it('preserves pattern data through round-trip', () => {
      const json = serializeTemplatesJSON(templates)
      const result = deserializeTemplatesJSON(json)
      const rotation = result[1]

      expect(rotation.pattern.kind).toBe('rotation')
      if (rotation.pattern.kind === 'rotation') {
        expect(rotation.pattern.cycleLength).toBe(2)
        expect(rotation.pattern.weeks).toEqual(['A', 'B'])
      }
    })
  })
})
