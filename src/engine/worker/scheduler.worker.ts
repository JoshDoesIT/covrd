import { solveSchedule } from '../solver/csp'

self.onmessage = (e: MessageEvent) => {
  const msg = e.data

  if (msg.type === 'START_SOLVE') {
    try {
      const { employees, shifts } = msg.payload

      // Send an initial progress ping
      self.postMessage({ type: 'PROGRESS', percent: 10 })

      // Note: A true long-running solver would yield to emit progress,
      // but for covrd typical datasets (50 emps, 7 days) the CSP is
      // very fast. In the future we can interleave progress emits during backtracking.
      const result = solveSchedule(employees, shifts)

      // Final progress ping before completion
      self.postMessage({ type: 'PROGRESS', percent: 100 })

      self.postMessage({
        type: 'COMPLETE',
        payload: result,
      })
    } catch (error: unknown) {
      self.postMessage({
        type: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown solver error',
      })
    }
  }
}
