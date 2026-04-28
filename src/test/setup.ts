import { afterEach, vi } from 'vitest'

function ensureUrlMethod(
  name: 'createObjectURL' | 'revokeObjectURL',
  fallback: (...args: unknown[]) => unknown,
): void {
  const hasMethod = typeof (URL as unknown as Record<string, unknown>)[name] === 'function'
  if (!hasMethod) {
    Object.defineProperty(URL, name, {
      configurable: true,
      writable: true,
      value: fallback,
    })
  }
}

ensureUrlMethod('createObjectURL', () => 'blob:mock')
ensureUrlMethod('revokeObjectURL', () => undefined)

// Keep tests isolated even when individual files forget cleanup.
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})


