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

  // Keep a stable DietPreference shape even if /nutrition has a different DTO.
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

async function mapDietPreferences(): Promise<DietPreference[]> {
  const response = await fetch(`${API_BASE_URL}/nutrition`)
  if (!response.ok) {
    throw new Error(`Erreur API nutrition: ${response.status}`)
  }
  const payload: unknown = await response.json()
  return normalizeNutritionPayload(payload).map(toDietPreference)
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

export async function loadDashboardData(): Promise<DashboardData> {
  return {
    patients: mapPatients(),
    healthProfiles: mapHealthProfiles(),
    dietPreferences: await mapDietPreferences(),
    foodNutrition: mapFoodNutrition(),
    exerciseTracking: mapExerciseTracking(),
  }
}

