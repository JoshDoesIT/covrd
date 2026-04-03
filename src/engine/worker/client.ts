import { Employee, Shift } from '../../types'
import { SolveResult } from '../solver/csp'

export type ProgressCallback = (percentComplete: number) => void

/**
 * Wraps the Web Worker in a Promise-based API for the main thread.
 */
export function generateScheduleAsync(
  employees: Employee[],
  shifts: Shift[],
  onProgress?: ProgressCallback
): Promise<SolveResult> {
  return new Promise((resolve, reject) => {
    // Note: In Vite, you typically format this slightly differently 
    // if not relying on standard bundler pathing, but for tests 
    // the global Worker injection will intercept this.
    const worker = new Worker(new URL('./scheduler.worker.ts', import.meta.url), {
      type: 'module'
    })

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data
      
      switch (msg.type) {
        case 'PROGRESS':
          if (onProgress) onProgress(msg.percent)
          break
        case 'COMPLETE':
          worker.terminate()
          resolve(msg.payload)
          break
        case 'ERROR':
          worker.terminate()
          reject(new Error(msg.message))
          break
      }
    }

    worker.onerror = (err) => {
      worker.terminate()
      reject(err)
    }

    worker.postMessage({
      type: 'START_SOLVE',
      payload: { employees, shifts }
    })
  })
}
