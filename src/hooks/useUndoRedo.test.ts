import { describe, test, expect } from 'vitest'
import { UndoRedoManager } from './useUndoRedo'

describe('UndoRedoManager', () => {
  test('starts with no undo/redo available', () => {
    const manager = new UndoRedoManager<string>()
    expect(manager.canUndo).toBe(false)
    expect(manager.canRedo).toBe(false)
  })

  test('push adds to history and enables undo', () => {
    const manager = new UndoRedoManager<string>()
    manager.push('state-1')
    expect(manager.canUndo).toBe(true)
    expect(manager.canRedo).toBe(false)
  })

  test('undo returns previous state', () => {
    const manager = new UndoRedoManager<string>()
    manager.push('state-1')
    manager.push('state-2')

    const undone = manager.undo()
    expect(undone).toBe('state-1')
    expect(manager.canRedo).toBe(true)
  })

  test('redo returns next state after undo', () => {
    const manager = new UndoRedoManager<string>()
    manager.push('state-1')
    manager.push('state-2')
    manager.undo()

    const redone = manager.redo()
    expect(redone).toBe('state-2')
  })

  test('push after undo clears redo stack', () => {
    const manager = new UndoRedoManager<string>()
    manager.push('A')
    manager.push('B')
    manager.undo()
    manager.push('C')
    expect(manager.canRedo).toBe(false)
  })

  test('respects max history limit', () => {
    const manager = new UndoRedoManager<number>(3)
    manager.push(1)
    manager.push(2)
    manager.push(3)
    manager.push(4) // Should push out 1

    expect(manager.undo()).toBe(3)
    expect(manager.undo()).toBe(2)
    expect(manager.undo()).toBeUndefined() // past limit
  })

  test('undo returns undefined when nothing to undo', () => {
    const manager = new UndoRedoManager<string>()
    expect(manager.undo()).toBeUndefined()
  })

  test('redo returns undefined when nothing to redo', () => {
    const manager = new UndoRedoManager<string>()
    expect(manager.redo()).toBeUndefined()
  })

  test('clear resets all history', () => {
    const manager = new UndoRedoManager<string>()
    manager.push('A')
    manager.push('B')
    manager.clear()
    expect(manager.canUndo).toBe(false)
    expect(manager.canRedo).toBe(false)
  })
})
