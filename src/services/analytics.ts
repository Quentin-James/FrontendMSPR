import type {
  DashboardData,
  DashboardKpis,
  DataAnomaly,
  DietPreference,
  ExerciseTracking,
  FoodNutrition,
  Patient,
} from '../types/dashboard'
import type { AgePyramidBand } from '../types/dashboard-contracts'

function average(values: number[]): number {
  if (values.length === 0) {
    return 0
  }
  const total = values.reduce((sum, value) => sum + value, 0)
  return total / values.length
}

function round(value: number, decimals = 1): number {
  const ratio = 10 ** decimals
  return Math.round(value * ratio) / ratio
}

function adherenceScore(entries: DietPreference[]): number {
  const map: Record<string, number> = {
    high: 100,
    medium: 65,
    low: 30,
  }
  const scores = entries.map((entry) => map[entry.adherenceToDiet] ?? 50)
  return round(average(scores), 1)
}

function uniquePatientIds(data: DashboardData): Set<number> {
  return new Set(data.patients.map((item) => item.id))
}

export function detectAnomalies(data: DashboardData): DataAnomaly[] {
  const anomalies: DataAnomaly[] = []
  const patientIds = uniquePatientIds(data)

  data.patients.forEach((patient) => {
    if (patient.age < 12 || patient.age > 100) {
      anomalies.push({
        id: `patients-${patient.id}-age`,
        dataset: 'patients',
        recordId: patient.id,
        field: 'age',
        value: String(patient.age),
        issue: 'Age hors plage attendue [12, 100]',
        severity: 'high',
        fixed: false,
      })
    }

    if (patient.bmi <= 0 || patient.bmi > 60) {
      anomalies.push({
        id: `patients-${patient.id}-bmi`,
        dataset: 'patients',
        recordId: patient.id,
        field: 'bmi',
        value: String(patient.bmi),
        issue: 'BMI invalide',
        severity: 'high',
        fixed: false,
      })
    }
  })

  data.healthProfiles.forEach((profile) => {
    if (!patientIds.has(profile.patientId)) {
      anomalies.push({
        id: `healthProfiles-${profile.id}-patient`,
        dataset: 'healthProfiles',
        recordId: profile.id,
        field: 'patientId',
        value: String(profile.patientId),
        issue: 'Reference patient inexistante',
        severity: 'high',
        fixed: false,
      })
    }

    if (!/^\d{2,3}\/\d{2,3}$/.test(profile.bloodPressureMmhg)) {
      anomalies.push({
        id: `healthProfiles-${profile.id}-blood-pressure`,
        dataset: 'healthProfiles',
        recordId: profile.id,
        field: 'bloodPressureMmhg',
        value: profile.bloodPressureMmhg,
        issue: 'Format tension attendu systolique/diastolique',
        severity: 'medium',
        fixed: false,
      })
    }
  })

  data.foodNutrition.forEach((item) => {
    if (item.caloriesKcal <= 0) {
      anomalies.push({
        id: `foodNutrition-${item.id}-calories`,
        dataset: 'foodNutrition',
        recordId: item.id,
        field: 'caloriesKcal',
        value: String(item.caloriesKcal),
        issue: 'Calories <= 0',
        severity: 'high',
        fixed: false,
      })
    }

    if (item.sodiumMg > 2300) {
      anomalies.push({
        id: `foodNutrition-${item.id}-sodium`,
        dataset: 'foodNutrition',
        recordId: item.id,
        field: 'sodiumMg',
        value: String(item.sodiumMg),
        issue: 'Sodium eleve (> 2300mg)',
        severity: 'medium',
        fixed: false,
      })
    }
  })

  data.exerciseTracking.forEach((item) => {
    if (item.avgBpm > item.maxBpm) {
      anomalies.push({
        id: `exerciseTracking-${item.id}-bpm`,
        dataset: 'exerciseTracking',
        recordId: item.id,
        field: 'avgBpm',
        value: String(item.avgBpm),
        issue: 'Frequence cardiaque moyenne > max',
        severity: 'high',
        fixed: false,
      })
    }
  })

  return anomalies
}

function splitBloodPressure(value: string): { systolic: number; diastolic: number } {
  const parts = value.split('/')
  if (parts.length !== 2) {
    return { systolic: 0, diastolic: 0 }
  }
  return {
    systolic: Number(parts[0]) || 0,
    diastolic: Number(parts[1]) || 0,
  }
}

export function computeKpis(data: DashboardData, unresolvedAnomalies: number): DashboardKpis {
  const avgAge = round(average(data.patients.map((item) => item.age)), 1)
  const avgBmi = round(average(data.patients.map((item) => item.bmi)), 1)

  const highRiskProfiles = data.healthProfiles.filter((item) => {
    const pressure = splitBloodPressure(item.bloodPressureMmhg)
    return (
      item.glucoseMgDl >= 126 ||
      item.cholesterolMgDl >= 240 ||
      pressure.systolic >= 140 ||
      pressure.diastolic >= 90
    )
  }).length

  const qualityScore = round(
    Math.max(0, 100 - (unresolvedAnomalies / Math.max(data.patients.length, 1)) * 8),
    1,
  )

  const avgExerciseSessions = round(
    average(data.dietPreferences.map((item) => item.weeklyExerciseFrequency)),
    1,
  )

  const avgDailyCalories = round(
    average(data.healthProfiles.map((item) => item.dailyCaloricIntake)),
    0,
  )

  const premiumConversionRate = round(
    Math.min(100, 30 + avgExerciseSessions * 8 + adherenceScore(data.dietPreferences) * 0.25),
    1,
  )

  const estimatedSatisfaction = round(
    Math.min(100, 35 + adherenceScore(data.dietPreferences) * 0.45 + (100 - unresolvedAnomalies * 2.5) * 0.25),
    1,
  )

  return {
    totalPatients: data.patients.length,
    avgAge,
    avgBmi,
    qualityScore,
    anomalyCount: unresolvedAnomalies,
    highRiskProfiles,
    avgDietAdherenceScore: adherenceScore(data.dietPreferences),
    avgExerciseSessions,
    avgDailyCalories,
    premiumConversionRate,
    estimatedSatisfaction,
  }
}

function countByLabel<T>(rows: T[], getLabel: (entry: T) => string): Array<{ label: string; value: number }> {
  const bucket = new Map<string, number>()
  rows.forEach((row) => {
    const label = getLabel(row)
    bucket.set(label, (bucket.get(label) ?? 0) + 1)
  })

  return [...bucket.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value)
}

function normalizeLabel(label: string): string {
  return label
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function mealTypeRank(label: string): number {
  const order = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
  const index = order.indexOf(normalizeLabel(label))
  return index === -1 ? order.length : index
}

export function userMetrics(data: DashboardData): Array<{ label: string; value: number }> {
  return countByLabel(data.healthProfiles, (row) => normalizeLabel(row.diseaseType || 'None')).slice(0, 10)
}

export function severityMetrics(healthProfiles: DashboardData['healthProfiles']): Array<{ label: string; value: number }> {
  return countByLabel(healthProfiles, (row) => normalizeLabel(row.severity || 'Unknown')).slice(0, 10)
}

export function agePyramidMetrics(patients: DashboardData['patients']): AgePyramidBand[] {
  const bands: AgePyramidBand[] = [
    { label: '0-17', male: 0, female: 0 },
    { label: '18-30', male: 0, female: 0 },
    { label: '31-45', male: 0, female: 0 },
    { label: '46-60', male: 0, female: 0 },
    { label: '61+', male: 0, female: 0 },
  ]

  const bucket = (age: number): AgePyramidBand => {
    if (age <= 17) return bands[0]
    if (age <= 30) return bands[1]
    if (age <= 45) return bands[2]
    if (age <= 60) return bands[3]
    return bands[4]
  }

  patients.forEach((patient) => {
    const row = bucket(patient.age)
    const gender = normalizeLabel(patient.gender)
    if (gender === 'Male') {
      row.male += 1
      return
    }
    row.female += 1
  })

  return bands
}

export function bmiByDiseaseMetrics(
  patients: DashboardData['patients'],
  healthProfiles: DashboardData['healthProfiles'],
): Array<{ label: string; value: number }> {
  const patientById = new Map<number, Patient>()
  patients.forEach((patient) => {
    patientById.set(patient.id, patient)
  })

  const grouped = new Map<string, number[]>()
  healthProfiles.forEach((profile) => {
    const patient = patientById.get(profile.patientId)
    if (!patient) {
      return
    }
    const disease = normalizeLabel(profile.diseaseType || 'None')
    const values = grouped.get(disease) ?? []
    values.push(patient.bmi)
    grouped.set(disease, values)
  })

  return [...grouped.entries()]
    .map(([label, values]) => ({
      label,
      value: round(average(values), 1),
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 10)
}

export function nutritionMetrics(data: DashboardData): Array<{ label: string; value: number }> {
  return countByLabel(data.foodNutrition, (row) => normalizeLabel(row.category)).slice(0, 10)
}

export function nutritionMealAverageMetrics(data: DashboardData): Array<{ label: string; value: number }> {
  const grouped = new Map<string, number[]>()
  data.foodNutrition.forEach((item) => {
    if (!Number.isFinite(item.caloriesKcal) || item.caloriesKcal <= 0) {
      return
    }

    const label = normalizeLabel(item.mealType) || 'Unknown'
    const values = grouped.get(label) ?? []
    values.push(item.caloriesKcal)
    grouped.set(label, values)
  })

  return [...grouped.entries()]
    .map(([label, values]) => ({
      label,
      value: round(average(values), 0),
    }))
    .sort((left, right) => mealTypeRank(left.label) - mealTypeRank(right.label) || left.label.localeCompare(right.label))
}

export function topNutritionFoodsMetrics(data: DashboardData, count = 10): Array<{ label: string; value: number }> {
  return [...data.foodNutrition]
    .filter((item) => Number.isFinite(item.caloriesKcal) && item.caloriesKcal > 0)
    .sort((left, right) => right.caloriesKcal - left.caloriesKcal)
    .slice(0, count)
    .map((item) => ({
      label: normalizeLabel(item.foodItem) || normalizeLabel(item.category) || 'Unknown',
      value: round(item.caloriesKcal, 0),
    }))
}

export function fitnessMetrics(data: DashboardData): Array<{ label: string; value: number }> {
  return countByLabel(data.exerciseTracking, (row) => normalizeLabel(row.workoutType)).slice(0, 10)
}

export function fitnessCaloriesByWorkoutMetrics(
  exercises: DashboardData['exerciseTracking'],
): Array<{ label: string; value: number }> {
  const grouped = new Map<string, number[]>()

  exercises.forEach((entry) => {
    const workout = normalizeLabel(entry.workoutType)
    const values = grouped.get(workout) ?? []
    values.push(entry.caloriesBurned)
    grouped.set(workout, values)
  })

  return [...grouped.entries()]
    .map(([label, values]) => ({
      label,
      value: round(average(values), 0),
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 10)
}

export function fitnessAgeHistogramMetrics(
  exercises: DashboardData['exerciseTracking'],
): Array<{ label: string; value: number }> {
  const bins = [
    { label: '0-17', min: 0, max: 17, value: 0 },
    { label: '18-24', min: 18, max: 24, value: 0 },
    { label: '25-34', min: 25, max: 34, value: 0 },
    { label: '35-44', min: 35, max: 44, value: 0 },
    { label: '45-54', min: 45, max: 54, value: 0 },
    { label: '55-64', min: 55, max: 64, value: 0 },
    { label: '65+', min: 65, max: Number.POSITIVE_INFINITY, value: 0 },
  ]

  exercises.forEach((entry) => {
    const bucket = bins.find((item) => entry.age >= item.min && entry.age <= item.max)
    if (bucket) {
      bucket.value += 1
    }
  })

  return bins.map(({ label, value }) => ({ label, value }))
}

export function fitnessBmiByGenderMetrics(
  exercises: DashboardData['exerciseTracking'],
): Array<{ label: string; value: number }> {
  const grouped = new Map<string, number[]>()

  exercises.forEach((entry) => {
    const gender = normalizeLabel(entry.gender || 'Unknown')
    const values = grouped.get(gender) ?? []
    values.push(entry.bmi)
    grouped.set(gender, values)
  })

  return [...grouped.entries()]
    .map(([label, values]) => ({
      label,
      value: round(average(values), 1),
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
    .slice(0, 10)
}

export function normalizeSeverity(score: DataAnomaly['severity']): number {
  if (score === 'high') return 3
  if (score === 'medium') return 2
  return 1
}

export function updateAnomalyValue(
  data: DashboardData,
  anomaly: DataAnomaly,
  newValue: string,
): DashboardData {
  const next = structuredClone(data)

  if (anomaly.dataset === 'patients') {
    const target = next.patients.find((entry) => entry.id === anomaly.recordId)
    if (!target) return next
    if (anomaly.field === 'age') target.age = Number(newValue)
    if (anomaly.field === 'bmi') target.bmi = Number(newValue)
  }

  if (anomaly.dataset === 'healthProfiles') {
    const target = next.healthProfiles.find((entry) => entry.id === anomaly.recordId)
    if (!target) return next
    if (anomaly.field === 'bloodPressureMmhg') target.bloodPressureMmhg = newValue
    if (anomaly.field === 'patientId') target.patientId = Number(newValue)
  }

  if (anomaly.dataset === 'foodNutrition') {
    const target = next.foodNutrition.find((entry) => entry.id === anomaly.recordId)
    if (!target) return next
    if (anomaly.field === 'caloriesKcal') target.caloriesKcal = Number(newValue)
    if (anomaly.field === 'sodiumMg') target.sodiumMg = Number(newValue)
  }

  if (anomaly.dataset === 'exerciseTracking') {
    const target = next.exerciseTracking.find((entry) => entry.id === anomaly.recordId)
    if (!target) return next
    if (anomaly.field === 'avgBpm') target.avgBpm = Number(newValue)
  }

  return next
}

export function topAnomalies(anomalies: DataAnomaly[], count = 12): DataAnomaly[] {
  return [...anomalies]
    .sort((left, right) => normalizeSeverity(right.severity) - normalizeSeverity(left.severity))
    .slice(0, count)
}

export function ageBandMetrics(patients: Patient[]): Array<{ label: string; value: number }> {
  const bands = new Map<string, number>([
    ['18-30', 0],
    ['31-45', 0],
    ['46-60', 0],
    ['60+', 0],
  ])

  patients.forEach((item) => {
    if (item.age <= 30) bands.set('18-30', (bands.get('18-30') ?? 0) + 1)
    else if (item.age <= 45) bands.set('31-45', (bands.get('31-45') ?? 0) + 1)
    else if (item.age <= 60) bands.set('46-60', (bands.get('46-60') ?? 0) + 1)
    else bands.set('60+', (bands.get('60+') ?? 0) + 1)
  })

  return [...bands.entries()].map(([label, value]) => ({ label, value }))
}

export function progressionMetrics(dietPreferences: DietPreference[]): Array<{ label: string; value: number }> {
  return countByLabel(dietPreferences, (row) => row.adherenceToDiet)
}

export function intensityMetrics(exercises: ExerciseTracking[]): Array<{ label: string; value: number }> {
  return countByLabel(exercises, (row) => row.experienceLevel)
}

export function nutritionDeficitMetrics(food: FoodNutrition[]): Array<{ label: string; value: number }> {
  const highSugar = food.filter((item) => item.sugarsG >= 20).length
  const highSodium = food.filter((item) => item.sodiumMg >= 1500).length
  const lowFiber = food.filter((item) => item.fiberG <= 2).length
  return [
    { label: 'Sucres eleves', value: highSugar },
    { label: 'Sodium eleve', value: highSodium },
    { label: 'Fibres basses', value: lowFiber },
  ]
}

