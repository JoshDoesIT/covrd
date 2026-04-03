import { vi } from 'vitest'
import { generateScheduleAsync } from './client'

// Simplified mock of the Web Worker API for testing
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  postMessage(data: unknown) {
    // Simulate async worker response
    setTimeout(() => {
      if (
        typeof data === 'object' &&
        data !== null &&
        'type' in (data as Record<string, unknown>)
      ) {
        const payload = data as { type: string }
        if (payload.type === 'START_SOLVE') {
          // Send a progress event
          if (this.onmessage) {
            this.onmessage({ data: { type: 'PROGRESS', percent: 50 } } as MessageEvent)
          }

          // Send completion event
          setTimeout(() => {
            if (this.onmessage) {
              this.onmessage({
                data: {
                  type: 'COMPLETE',
                  payload: { success: true, assignedShifts: [], unfilledShifts: [] },
                },
              } as MessageEvent)
            }
          }, 10)
        }
      }
    }, 10)
  }
  terminate() {}
}

describe('Worker Client', () => {
  beforeAll(() => {
    // Inject Mock Worker into global scope
    vi.stubGlobal('Worker', MockWorker)
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('runs solve async and resolves on complete', async () => {
    const progressCallback = vi.fn()

    // Pass empty arrays for the payload
    const result = await generateScheduleAsync([], [], progressCallback)

    expect(result.success).toBe(true)
    expect(progressCallback).toHaveBeenCalledWith(50)
  })
})
