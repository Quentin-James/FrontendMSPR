import { API_BASE_URL } from '../../apiConfig'
import type { CleaningRow, CleaningTabKey, DashboardRepository } from '../../types/dashboard-contracts'
import type { DashboardData } from '../../types/dashboard'
import {
  endpointForTab,
  mapHealthProfilesFromDietRows,
  mapPatientsFromDietRows,
  normalizeRowsPayload,
  toCleaningRow,
  toDietPreference,
  toExerciseTracking,
  toFoodNutrition,
} from './dashboardApiMapper'

async function fetchRows(endpoint: string): Promise<CleaningRow[]> {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`)
  if (!response.ok) {
    throw new Error(`Erreur API ${endpoint}: ${response.status}`)
  }

  const payload: unknown = await response.json()
  return normalizeRowsPayload(payload).map(toCleaningRow)
}

export class DashboardApiRepository implements DashboardRepository {
  async load(): Promise<DashboardData> {
    const [dietRows, gymRows, nutritionRows] = await Promise.all([
      fetchRows('diet'),
      fetchRows('gym'),
      fetchRows('nutrition'),
    ])

    return {
      patients: mapPatientsFromDietRows(dietRows),
      healthProfiles: mapHealthProfilesFromDietRows(dietRows),
      dietPreferences: dietRows.map(toDietPreference),
      foodNutrition: nutritionRows.map(toFoodNutrition),
      exerciseTracking: gymRows.map(toExerciseTracking),
    }
  }

  async loadCleaningTab(tab: CleaningTabKey): Promise<CleaningRow[]> {
    return fetchRows(endpointForTab(tab))
  }

  async createCleaningRow(tab: CleaningTabKey, payload: CleaningRow): Promise<CleaningRow> {
    const endpoint = endpointForTab(tab)
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Creation ${tab} impossible: ${response.status}`)
    }

    const created: unknown = await response.json()
    return toCleaningRow(created)
  }

  async updateCleaningRow(tab: CleaningTabKey, id: number, payload: CleaningRow): Promise<CleaningRow> {
    const endpoint = endpointForTab(tab)
    const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Mise a jour ${tab} impossible: ${response.status}`)
    }

    const updated: unknown = await response.json()
    return toCleaningRow(updated)
  }

  async deleteCleaningRow(tab: CleaningTabKey, id: number): Promise<void> {
    const endpoint = endpointForTab(tab)
    const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`Suppression ${tab} impossible: ${response.status}`)
    }
  }
}

