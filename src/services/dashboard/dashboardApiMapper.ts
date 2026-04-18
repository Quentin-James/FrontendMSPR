// Fonctions utilitaires et mappers pour transformer les payloads API en objets métier typés
// et garantir la cohérence des données pour le dashboard (nettoyage, analytics, CRUD)

import type {
  CleaningCellValue,
  CleaningRow,
  CleaningTabKey,
} from '../../types/dashboard-contracts'
import type {
  DietPreference,
  ExerciseTracking,
  FoodNutrition,
  HealthProfile,
  Patient,
} from '../../types/dashboard'

/**
 * Normalise un payload API en tableau d'objets.
 * Accepte soit un tableau direct, soit un objet { data: [...] }.
 */
export function normalizeRowsPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (typeof payload === 'object' && payload !== null) {
    const wrapped = payload as { data?: unknown }
    if (Array.isArray(wrapped.data)) return wrapped.data
  }
  return []
}

/**
 * Convertit une valeur quelconque en CleaningCellValue (string, number, boolean ou null).
 * Les objets sont stringifiés.
 */
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

/**
 * Transforme une entrée brute (objet API) en CleaningRow (clé-valeur typé dashboard).
 * Garantit la présence d'un champ id numérique unique (utilise patientId si id absent ou invalide).
 */
export function toCleaningRow(entry: unknown): CleaningRow {
  if (typeof entry !== 'object' || entry === null) {
    return {}
  }
  // Copie toutes les propriétés, conversion typée
  const row = Object.entries(entry as Record<string, unknown>).reduce<CleaningRow>((acc, [key, value]) => {
    acc[key] = toCellValue(value)
    return acc
  }, {})
  // Correction : utilise patientId pour diet et gym
  const idNum = Number(row.id)
  if (!Number.isFinite(idNum)) {
    const patientIdNum = Number(row.patientId)
    if (Number.isFinite(patientIdNum)) {
      row.id = patientIdNum
    }
  }
  return row
}

/**
 * Lit la première string non vide trouvée parmi les clés candidates d'une row.
 */
function readString(row: CleaningRow, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }
  return ''
}

/**
 * Lit le premier nombre valide trouvé parmi les clés candidates d'une row.
 */
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

/**
 * Mappe une CleaningRow (onglet diet) en DietPreference typé (pour analytics/kpi).
 * Fallback sur 'medium' si l'adherence n'est pas renseignée.
 */
export function toDietPreference(row: CleaningRow): DietPreference {
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

/**
 * Mappe un tableau de CleaningRow (diet) en tableau de Patient typé.
 * Utilise plusieurs clés candidates pour l'id patient.
 */
export function mapPatientsFromDietRows(rows: CleaningRow[]): Patient[] {
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

/**
 * Mappe un tableau de CleaningRow (diet) en tableau de HealthProfile typé.
 * Fallback sur index+1 si id absent.
 */
export function mapHealthProfilesFromDietRows(rows: CleaningRow[]): HealthProfile[] {
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

/**
 * Mappe une entrée API nutrition en FoodNutrition typé.
 * Gère les variantes de nommage de colonnes.
 */
export function toFoodNutrition(entry: unknown): FoodNutrition {
  const row = (typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>) : {})

  const normalizeKey = (key: string): string => key.toLowerCase().replace(/[\s_-]+/g, '')

  const normalizedEntries = new Map<string, unknown>()
  Object.entries(row).forEach(([key, value]) => {
    const normalized = normalizeKey(key)
    if (!normalizedEntries.has(normalized)) {
      normalizedEntries.set(normalized, value)
    }
  })

  const readRaw = (...keys: string[]): unknown => {
    for (const key of keys) {
      if (key in row) {
        return row[key]
      }
      const normalized = normalizeKey(key)
      if (normalizedEntries.has(normalized)) {
        return normalizedEntries.get(normalized)
      }
    }
    return undefined
  }

  const parseNumber = (value: unknown, fallback = 0): number => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : fallback
    }
    if (typeof value === 'string') {
      const compact = value.trim()
      if (compact.length === 0) return fallback

      const direct = Number(compact)
      if (Number.isFinite(direct)) return direct

      const matched = compact.match(/-?\d+(?:[.,]\d+)?/)
      if (!matched) return fallback
      const parsed = Number(matched[0].replace(',', '.'))
      return Number.isFinite(parsed) ? parsed : fallback
    }
    return fallback
  }

  const asNumber = (...keys: string[]): number => {
    return parseNumber(readRaw(...keys), 0)
  }

  const asString = (...keys: string[]): string => {
    const value = readRaw(...keys)
    return typeof value === 'string' ? value : ''
  }

  return {
    id: asNumber('id', 'nutritionId', 'nutrition_id', 'foodId', 'food_id'),
    foodItem: asString('foodItem', 'food_item', 'food', 'foodName', 'food_name', 'item', 'name', 'description'),
    category: asString('category', 'categoryName', 'category_name', 'foodCategory', 'food_category', 'group', 'foodGroup'),
    caloriesKcal: asNumber(
      'caloriesKcal',
      'calories_kcal',
      'calories',
      'kcal',
      'caloricValue',
      'caloric_value',
      'energyKcal',
      'energy_kcal',
    ),
    proteinG: asNumber('proteinG', 'protein_g', 'protein'),
    carbohydratesG: asNumber('carbohydratesG', 'carbohydrates_g', 'carbs', 'carbohydrates'),
    fatG: asNumber('fatG', 'fat_g', 'fat'),
    fiberG: asNumber('fiberG', 'fiber_g', 'fiber', 'fibre_g', 'fibre'),
    sugarsG: asNumber('sugarsG', 'sugars_g', 'sugars', 'sugar_g', 'sugar'),
    sodiumMg: asNumber('sodiumMg', 'sodium_mg', 'sodium'),
    cholesterolMg: asNumber('cholesterolMg', 'cholesterol_mg', 'cholesterol'),
    mealType: asString('mealType', 'meal_type', 'meal', 'mealName', 'meal_name', 'mealCategory', 'meal_category'),
    waterIntakeMl: asNumber('waterIntakeMl', 'water_intake_ml', 'waterMl', 'water_ml'),
  }
}

/**
 * Mappe une entrée API gym en ExerciseTracking typé.
 * Gère les variantes de nommage de colonnes.
 */
export function toExerciseTracking(entry: unknown): ExerciseTracking {
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

/**
 * Retourne l'endpoint API associé à un onglet cleaning.
 */
export function endpointForTab(tab: CleaningTabKey): string {
  if (tab === 'nutrition') return 'nutrition'
  if (tab === 'diet') return 'diet'
  return 'gym'
}
