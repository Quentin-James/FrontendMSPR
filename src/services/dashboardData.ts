import type {
  DashboardData,
  DietPreference,
  ExerciseTracking,
  FoodNutrition,
  HealthProfile,
  Patient,
} from '../types/dashboard'
import { parseCsv, toNumber } from './csv'
import { API_BASE_URL } from '../apiConfig'

import patientsCsv from '../../mock-data/healthai_coach.public/patients.csv?raw'
import healthProfilesCsv from '../../mock-data/healthai_coach.public/health_profiles.csv?raw'
import dailyFoodCsv from '../../mock-data/healthai_coach.public/daily_food_nutrition.csv?raw'

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

function toDietPreference(entry: unknown): DietPreference {
  const row = (typeof entry === 'object' && entry !== null
    ? (entry as Record<string, unknown>)
    : {})

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

  // Keep a stable DietPreference shape even if /diet has a different DTO.
  return {
    id: asNumber('id'),
    patientId: asNumber('patientId', asNumber('patient_id')),
    dietaryRestrictions: asString('dietaryRestrictions', asString('dietary_restrictions')),
    allergies: asString('allergies'),
    preferredCuisine: asString('preferredCuisine', asString('preferred_cuisine', asString('categoryName'))),
    weeklyExerciseFrequency: asNumber('weeklyExerciseFrequency', asNumber('weekly_exercise_frequency')),
    adherenceToDiet: asString('adherenceToDiet', asString('adherence_to_diet', 'medium')).toLowerCase(),
  }
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

async function mapDietPreferences(): Promise<DietPreference[]> {
  const response = await fetch(`${API_BASE_URL}/diet`)
  if (!response.ok) {
    throw new Error(`Erreur API diet: ${response.status}`)
  }
  const payload: unknown = await response.json()
  return normalizeRowsPayload(payload).map(toDietPreference)
}

function toExerciseTracking(entry: unknown): ExerciseTracking {
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
    age: asNumber('age'),
    gender: asString('gender'),
    weightKg: asNumber('weightKg', asNumber('weight_kg')),
    heightM: asNumber('heightM', asNumber('height_m')),
    maxBpm: asNumber('maxBpm', asNumber('max_bpm')),
    avgBpm: asNumber('avgBpm', asNumber('avg_bpm')),
    restingBpm: asNumber('restingBpm', asNumber('resting_bpm')),
    sessionDurationHours: asNumber('sessionDurationHours', asNumber('session_duration_hours')),
    caloriesBurned: asNumber('caloriesBurned', asNumber('calories_burned')),
    workoutType: asString('workoutType', asString('workout_type')),
    fatPercentage: asNumber('fatPercentage', asNumber('fat_percentage')),
    waterIntakeLiters: asNumber('waterIntakeLiters', asNumber('water_intake_liters')),
    workoutFrequencyDaysWeek: asNumber('workoutFrequencyDaysWeek', asNumber('workout_frequency_days_week')),
    experienceLevel: asString('experienceLevel', asString('experience_level')),
    bmi: asNumber('bmi'),
  }
}

async function mapFoodNutrition(): Promise<FoodNutrition[]> {
  const response = await fetch(`${API_BASE_URL}/nutrition`)
  if (!response.ok) {
    throw new Error(`Erreur API nutrition: ${response.status}`)
  }

  const payload: unknown = await response.json()
  return normalizeRowsPayload(payload).map(toFoodNutrition)
}

async function mapGymTracking(): Promise<ExerciseTracking[]> {
  const response = await fetch(`${API_BASE_URL}/gym`)
  if (!response.ok) {
    throw new Error(`Erreur API gym: ${response.status}`)
  }

  const payload: unknown = await response.json()
  return normalizeRowsPayload(payload).map(toExerciseTracking)
}

export async function loadDashboardData(): Promise<DashboardData> {
  return {
    patients: mapPatients(),
    healthProfiles: mapHealthProfiles(),
    dietPreferences: await mapDietPreferences(),
    foodNutrition: await mapFoodNutrition(),
    exerciseTracking: await mapGymTracking(),
  }
}

