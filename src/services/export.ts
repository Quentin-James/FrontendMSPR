import type { DashboardData } from '../types/dashboard'

function download(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

function toCsv(data: DashboardData): string {
  const rows: string[] = ['dataset,record_id,payload']

  const appendRows = <T extends { id: number }>(dataset: string, values: T[]): void => {
    values.forEach((entry) => {
      const payload = JSON.stringify(entry).replaceAll('"', '""')
      rows.push(`${dataset},${entry.id},"${payload}"`)
    })
  }

  appendRows('patients', data.patients)
  appendRows('healthProfiles', data.healthProfiles)
  appendRows('dietPreferences', data.dietPreferences)
  appendRows('foodNutrition', data.foodNutrition)
  appendRows('exerciseTracking', data.exerciseTracking)

  return rows.join('\n')
}

export function exportJson(data: DashboardData): void {
  download(JSON.stringify(data, null, 2), 'cleaned-dataset.json', 'application/json;charset=utf-8')
}

export function exportCsv(data: DashboardData): void {
  download(toCsv(data), 'cleaned-dataset.csv', 'text/csv;charset=utf-8')
}

