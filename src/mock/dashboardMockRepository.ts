import type {
  DashboardData,
  DietPreference,
  ExerciseTracking,
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
import dailyFoodCsv from '../../mock-data/healthai_coach.public/daily_food_nutrition.csv?raw'
import exerciseCsv from '../../mock-data/healthai_coach.public/gym_members_exercise_tracking.csv?raw'

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

function normalizeNutritionPayload(payload: unknown): unknown[] {
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

async function fetchNutritionRows(): Promise<CleaningRow[]> {
  const response = await fetch(`${API_BASE_URL}/nutrition`)
  if (!response.ok) {
    throw new Error(`Erreur API nutrition: ${response.status}`)
  }

  const payload: unknown = await response.json()
  return normalizeNutritionPayload(payload).map(toCleaningRow)
}

function endpointForTab(tab: CleaningTabKey): string {
  if (tab === 'nutrition') return 'nutrition'
  return 'nutrition'
}

function mapFoodNutrition(): FoodNutrition[] {
  return parseCsv(dailyFoodCsv).map((row) => ({
    id: toNumber(row.id),
    foodItem: row.food_item,
    category: row.category,
    caloriesKcal: toNumber(row.calories_kcal),
    proteinG: toNumber(row.protein_g),
    carbohydratesG: toNumber(row.carbohydrates_g),
    fatG: toNumber(row.fat_g),
    fiberG: toNumber(row.fiber_g),
    sugarsG: toNumber(row.sugars_g),
    sodiumMg: toNumber(row.sodium_mg),
    cholesterolMg: toNumber(row.cholesterol_mg),
    mealType: row.meal_type,
    waterIntakeMl: toNumber(row.water_intake_ml),
  }))
}

function mapExerciseTracking(): ExerciseTracking[] {
  return parseCsv(exerciseCsv).map((row) => ({
    id: toNumber(row.id),
    age: toNumber(row.age),
    gender: row.gender,
    weightKg: toNumber(row.weight_kg),
    heightM: toNumber(row.height_m),
    maxBpm: toNumber(row.max_bpm),
    avgBpm: toNumber(row.avg_bpm),
    restingBpm: toNumber(row.resting_bpm),
    sessionDurationHours: toNumber(row.session_duration_hours),
    caloriesBurned: toNumber(row.calories_burned),
    workoutType: row.workout_type,
    fatPercentage: toNumber(row.fat_percentage),
    waterIntakeLiters: toNumber(row.water_intake_liters),
    workoutFrequencyDaysWeek: toNumber(row.workout_frequency_days_week),
    experienceLevel: row.experience_level,
    bmi: toNumber(row.bmi),
  }))
}

export class DashboardMockRepository implements DashboardRepository {
  async load(): Promise<DashboardData> {
    const nutritionRows = await fetchNutritionRows()

    return {
      patients: mapPatients(),
      healthProfiles: mapHealthProfiles(),
      dietPreferences: nutritionRows.map(toDietPreference),
      foodNutrition: mapFoodNutrition(),
      exerciseTracking: mapExerciseTracking(),
    }
  }

  async loadCleaningTab(tab: CleaningTabKey): Promise<CleaningRow[]> {
    const endpoint = endpointForTab(tab)
    const response = await fetch(`${API_BASE_URL}/${endpoint}`)
    if (!response.ok) {
      throw new Error(`Chargement ${tab} impossible: ${response.status}`)
    }

    const payload: unknown = await response.json()
    return normalizeNutritionPayload(payload).map(toCleaningRow)
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

