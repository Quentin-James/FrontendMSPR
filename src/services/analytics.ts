import type {
  DashboardData,
  DashboardKpis,
  DataAnomaly,
  DietPreference,
  ExerciseTracking,
  FoodNutrition,
  Patient,
} from '../types/dashboard'

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

export function userMetrics(data: DashboardData): Array<{ label: string; value: number }> {
  return countByLabel(data.healthProfiles, (row) => row.diseaseType)
}

export function nutritionMetrics(data: DashboardData): Array<{ label: string; value: number }> {
  const grouped = countByLabel(data.foodNutrition, (row) => row.mealType)
  return grouped.map((entry) => {
    const rows = data.foodNutrition.filter((row) => row.mealType === entry.label)
    return {
      label: `${entry.label} (kcal moy.)`,
      value: round(average(rows.map((row) => row.caloriesKcal)), 0),
    }
  })
}

export function fitnessMetrics(data: DashboardData): Array<{ label: string; value: number }> {
  return countByLabel(data.exerciseTracking, (row) => row.workoutType)
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

