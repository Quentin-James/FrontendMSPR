import { describe, expect, it, vi } from 'vitest'
import { exportCsv, exportJson } from '../services/export'

describe('export service', () => {
  it('genere un fichier JSON avec le nom attendu', () => {
    const click = vi.fn()
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      click,
      set href(_: string) {},
      set download(_: string) {},
    } as unknown as HTMLAnchorElement)
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    exportJson('diet', [{ id: 1, note: 'ok' }])

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock')
    expect(click).toHaveBeenCalledTimes(1)
  })

  it('echappe les guillemets dans le CSV', () => {
    let captured = ''
    vi.stubGlobal(
      'Blob',
      class {
        constructor(parts: unknown[]) {
          captured = String(parts[0] ?? '')
        }
      } as unknown as typeof Blob,
    )

    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:csv')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      click: vi.fn(),
      set href(_: string) {},
      set download(_: string) {},
    } as unknown as HTMLAnchorElement)

    exportCsv('nutrition', [{ id: 1, label: 'valeur "quote"' }])

    expect(captured).toContain('id,label')
    expect(captured).toContain('"valeur ""quote"""')

    createElementSpy.mockRestore()
    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
  })
})




