/**
 * UndoRedoManager — Generic vanilla undo/redo history stack for use inside Zustand.
 */
export class UndoRedoManager<T> {
  private undoStack: T[] = []
  private redoStack: T[] = []
  private maxHistory: number

  constructor(maxHistory = 50) {
    this.maxHistory = maxHistory
  }

  push(state: T): void {
    this.undoStack.push(JSON.parse(JSON.stringify(state)))
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift()
    }
    this.redoStack = []
  }

  undo(): T | undefined {
    const state = this.undoStack.pop()
    if (state !== undefined) {
      this.redoStack.push(state)
    }
    return this.undoStack.length > 0
      ? JSON.parse(JSON.stringify(this.undoStack[this.undoStack.length - 1]))
      : undefined
  }

  redo(): T | undefined {
    const state = this.redoStack.pop()
    if (state !== undefined) {
      this.undoStack.push(state)
    }
    return state !== undefined ? JSON.parse(JSON.stringify(state)) : undefined
  }

  clear(): void {
    this.undoStack = []
    this.redoStack = []
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0
  }
}
