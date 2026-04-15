import type {
  DashboardData,
  DietPreference,
  FoodNutrition,
  HealthProfile,
  Patient,
} from '../types/dashboard'
import type {
  CleaningCellValue,
  CleaningRow,
  CleaningTabKey,
  DashboardRepository,
} from '../types/dashboard-contracts'
import { API_BASE_URL } from '../apiConfig'
import { parseCsv, toNumber } from '../services/csv'

import patientsCsv from '../../mock-data/healthai_coach.public/patients.csv?raw'
import healthProfilesCsv from '../../mock-data/healthai_coach.public/health_profiles.csv?raw'

function mapPatients(): Patient[] {
  return parseCsv(patientsCsv).map((row) => ({
    id: toNumber(row.id),
    age: toNumber(row.age),
    gender: row.gender,
    weightKg: toNumber(row.weight_kg),
    heightCm: toNumber(row.height_cm),
    bmi: toNumber(row.bmi),
  }))
}

function mapHealthProfiles(): HealthProfile[] {
  return parseCsv(healthProfilesCsv).map((row) => ({
    id: toNumber(row.id),
    patientId: toNumber(row.patient_id),
    diseaseType: row.disease_type,
    severity: row.severity,
    physicalActivityLevel: row.physical_activity_level,
    dailyCaloricIntake: toNumber(row.daily_caloric_intake),
    cholesterolMgDl: toNumber(row.cholesterol_mg_dl),
    bloodPressureMmhg: row.blood_pressure_mmhg,
    glucoseMgDl: toNumber(row.glucose_mg_dl),
  }))
}

function normalizeRowsPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (typeof payload === 'object' && payload !== null) {
    const wrapped = payload as { data?: unknown }
    if (Array.isArray(wrapped.data)) return wrapped.data
  }
  return []
}

function toCellValue(value: unknown): CleaningCellValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }
  return String(value ?? '')
}

function toCleaningRow(entry: unknown): CleaningRow {
  if (typeof entry !== 'object' || entry === null) {
    return {}
  }

  return Object.entries(entry as Record<string, unknown>).reduce<CleaningRow>((acc, [key, value]) => {
    acc[key] = toCellValue(value)
    return acc
  }, {})
}

function readString(row: CleaningRow, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }
  return ''
}

function readNumber(row: CleaningRow, ...keys: string[]): number {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0
    }
    if (typeof value === 'string') {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }
  return 0
}

// Keep KPI computation stable by adapting nutrition DTO to DietPreference shape.
function toDietPreference(row: CleaningRow): DietPreference {
  return {
    id: readNumber(row, 'id'),
    patientId: readNumber(row, 'patientId', 'patient_id'),
    dietaryRestrictions: readString(row, 'dietaryRestrictions', 'dietary_restrictions'),
    allergies: readString(row, 'allergies'),
    preferredCuisine: readString(row, 'preferredCuisine', 'preferred_cuisine', 'categoryName'),
    weeklyExerciseFrequency: readNumber(row, 'weeklyExerciseFrequency', 'weekly_exercise_frequency'),
    adherenceToDiet: readString(row, 'adherenceToDiet', 'adherence_to_diet').toLowerCase() || 'medium',
  }
}

function mapPatientsFromDietRows(rows: CleaningRow[]): Patient[] {
  return rows
    .map((row) => ({
      id: readNumber(row, 'patientId', 'patient_id', 'id'),
      age: readNumber(row, 'age'),
      gender: readString(row, 'gender', 'sex'),
      weightKg: readNumber(row, 'weightKg', 'weight_kg'),
      heightCm: readNumber(row, 'heightCm', 'height_cm'),
      bmi: readNumber(row, 'bmi'),
    }))
    .filter((patient) => patient.id > 0)
}

function mapHealthProfilesFromDietRows(rows: CleaningRow[]): HealthProfile[] {
  return rows
    .map((row, index) => ({
      id: readNumber(row, 'id', 'profileId', 'profile_id') || index + 1,
      patientId: readNumber(row, 'patientId', 'patient_id', 'id'),
      diseaseType: readString(row, 'diseaseType', 'disease_type', 'condition', 'diagnosis', 'pathology') || 'none',
      severity: readString(row, 'severity', 'riskLevel', 'risk_level') || 'unknown',
      physicalActivityLevel: readString(row, 'physicalActivityLevel', 'physical_activity_level') || 'unknown',
      dailyCaloricIntake: readNumber(row, 'dailyCaloricIntake', 'daily_caloric_intake'),
      cholesterolMgDl: readNumber(row, 'cholesterolMgDl', 'cholesterol_mg_dl'),
      bloodPressureMmhg: readString(row, 'bloodPressureMmhg', 'blood_pressure_mmhg') || '0/0',
      glucoseMgDl: readNumber(row, 'glucoseMgDl', 'glucose_mg_dl'),
    }))
    .filter((profile) => profile.patientId > 0)
}

function toFoodNutrition(entry: unknown): FoodNutrition {
  const row = (typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>) : {})

  const asNumber = (key: string, fallback = 0): number => {
    const value = row[key]
    if (typeof value === 'number') return Number.isFinite(value) ? value : fallback
    if (typeof value === 'string') {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : fallback
    }
    return fallback
  }

  const asString = (key: string, fallback = ''): string => {
    const value = row[key]
    return typeof value === 'string' ? value : fallback
  }

  return {
    id: asNumber('id'),
    foodItem: asString('foodItem', asString('food_item')),
    category: asString('category', asString('categoryName')),
    caloriesKcal: asNumber('caloriesKcal', asNumber('calories_kcal')),
    proteinG: asNumber('proteinG', asNumber('protein_g')),
    carbohydratesG: asNumber('carbohydratesG', asNumber('carbohydrates_g')),
    fatG: asNumber('fatG', asNumber('fat_g')),
    fiberG: asNumber('fiberG', asNumber('fiber_g')),
    sugarsG: asNumber('sugarsG', asNumber('sugars_g')),
    sodiumMg: asNumber('sodiumMg', asNumber('sodium_mg')),
    cholesterolMg: asNumber('cholesterolMg', asNumber('cholesterol_mg')),
    mealType: asString('mealType', asString('meal_type')),
    waterIntakeMl: asNumber('waterIntakeMl', asNumber('water_intake_ml')),
  }
}

async function fetchRows(endpoint: string): Promise<CleaningRow[]> {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`)
  if (!response.ok) {
    throw new Error(`Erreur API ${endpoint}: ${response.status}`)
  }

  const payload: unknown = await response.json()
  return normalizeRowsPayload(payload).map(toCleaningRow)
}

function endpointForTab(tab: CleaningTabKey): string {
  if (tab === 'nutrition') return 'nutrition'
  if (tab === 'diet') return 'diet'
  return 'gym'
}

async function fetchFoodNutrition(): Promise<FoodNutrition[]> {
  const response = await fetch(`${API_BASE_URL}/nutrition`)
  if (!response.ok) {
    throw new Error(`Erreur API nutrition: ${response.status}`)
  }

  const payload: unknown = await response.json()
  return normalizeRowsPayload(payload).map(toFoodNutrition)
}

export class DashboardMockRepository implements DashboardRepository {
  async load(): Promise<DashboardData> {
    const dietRows = await fetchRows('diet')
    const gymRows = await fetchRows('gym')
    const patientsFromDiet = mapPatientsFromDietRows(dietRows)
    const profilesFromDiet = mapHealthProfilesFromDietRows(dietRows)

    return {
      patients: patientsFromDiet.length > 0 ? patientsFromDiet : mapPatients(),
      healthProfiles: profilesFromDiet.length > 0 ? profilesFromDiet : mapHealthProfiles(),
      dietPreferences: dietRows.map(toDietPreference),
      foodNutrition: await fetchFoodNutrition(),
      exerciseTracking: gymRows.map((row) => ({
        id: readNumber(row, 'id'),
        age: readNumber(row, 'age'),
        gender: readString(row, 'gender'),
        weightKg: readNumber(row, 'weightKg', 'weight_kg'),
        heightM: readNumber(row, 'heightM', 'height_m'),
        maxBpm: readNumber(row, 'maxBpm', 'max_bpm'),
        avgBpm: readNumber(row, 'avgBpm', 'avg_bpm'),
        restingBpm: readNumber(row, 'restingBpm', 'resting_bpm'),
        sessionDurationHours: readNumber(row, 'sessionDurationHours', 'session_duration_hours'),
        caloriesBurned: readNumber(row, 'caloriesBurned', 'calories_burned'),
        workoutType: readString(row, 'workoutType', 'workout_type'),
        fatPercentage: readNumber(row, 'fatPercentage', 'fat_percentage'),
        waterIntakeLiters: readNumber(row, 'waterIntakeLiters', 'water_intake_liters'),
        workoutFrequencyDaysWeek: readNumber(row, 'workoutFrequencyDaysWeek', 'workout_frequency_days_week'),
        experienceLevel: readString(row, 'experienceLevel', 'experience_level'),
        bmi: readNumber(row, 'bmi'),
      })),
    }
  }

  async loadCleaningTab(tab: CleaningTabKey): Promise<CleaningRow[]> {
    const endpoint = endpointForTab(tab)
    const response = await fetch(`${API_BASE_URL}/${endpoint}`)
    if (!response.ok) {
      throw new Error(`Chargement ${tab} impossible: ${response.status}`)
    }

    const payload: unknown = await response.json()
    return normalizeRowsPayload(payload).map(toCleaningRow)
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

