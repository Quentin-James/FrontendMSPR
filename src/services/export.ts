import type { CleaningRow, CleaningTabKey } from '../types/dashboard-contracts'

function download(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

function normalizeFileSafe(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

function toCsv(rows: CleaningRow[]): string {
  if (rows.length === 0) {
    return ''
  }

  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))]
  const header = columns.join(',')

  const values = rows.map((row) =>
    columns
      .map((column) => {
        const raw = row[column]
        const text = raw === null || raw === undefined ? '' : String(raw)
        return `"${text.replaceAll('"', '""')}"`
      })
      .join(','),
  )

  return [header, ...values].join('\n')
}

export function exportJson(tab: CleaningTabKey, rows: CleaningRow[]): void {
  const fileName = `cleaned-${normalizeFileSafe(tab)}.json`
  download(JSON.stringify(rows, null, 2), fileName, 'application/json;charset=utf-8')
}

export function exportCsv(tab: CleaningTabKey, rows: CleaningRow[]): void {
  const fileName = `cleaned-${normalizeFileSafe(tab)}.csv`
  download(toCsv(rows), fileName, 'text/csv;charset=utf-8')
}

