import type {
  DashboardData,
  DietPreference,
  ExerciseTracking,
  FoodNutrition,
  HealthProfile,
  Patient,
} from '../types/dashboard'
import { parseCsv, toNumber } from './csv'

import patientsCsv from '../../mock-data/healthai_coach.public/patients.csv?raw'
import healthProfilesCsv from '../../mock-data/healthai_coach.public/health_profiles.csv?raw'
import dietPreferencesCsv from '../../mock-data/healthai_coach.public/diet_preferences.csv?raw'
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

function mapDietPreferences(): DietPreference[] {
  return parseCsv(dietPreferencesCsv).map((row) => ({
    id: toNumber(row.id),
    patientId: toNumber(row.patient_id),
    dietaryRestrictions: row.dietary_restrictions,
    allergies: row.allergies,
    preferredCuisine: row.preferred_cuisine,
    weeklyExerciseFrequency: toNumber(row.weekly_exercise_frequency),
    adherenceToDiet: row.adherence_to_diet,
  }))
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

export function NutritionPieChart({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return <p>Aucune donnée nutrition.</p>

  const cx = 120
  const cy = 120
  const r = 100

  let cumAngle = -Math.PI / 2
  const slices = data.map((entry, i) => {
    const ratio = entry.value / total
    const startAngle = cumAngle
    const endAngle = cumAngle + ratio * 2 * Math.PI
    cumAngle = endAngle

    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0

    const midAngle = (startAngle + endAngle) / 2
    const lx = cx + r * 0.65 * Math.cos(midAngle)
    const ly = cy + r * 0.65 * Math.sin(midAngle)
    const pct = Math.round(ratio * 100)

    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
    return { path, colorIndex: i % 8, label: entry.label, value: entry.value, pct, lx, ly }
  })

  return (
    <div className="pie-chart-wrap">
      <svg viewBox="0 0 240 240" width="240" height="240" className="pie-svg">
        {slices.map((s) => (
          <path key={s.label} d={s.path} className={`pie-slice pie-slice-${s.colorIndex}`} strokeWidth="1.5">
            <title>{s.label}: {s.value} ({s.pct}%)</title>
          </path>
        ))}
        {slices.filter((s) => s.pct >= 5).map((s) => (
          <text key={s.label + '-pct'} x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle" className="pie-label">
            {s.pct}%
          </text>
        ))}
      </svg>
      <ul className="pie-legend">
        {slices.map((s) => (
          <li key={s.label}>
            <svg className="pie-dot" viewBox="0 0 12 12" width="12" height="12">
              <circle cx="6" cy="6" r="6" className={`pie-slice-${s.colorIndex}`} />
            </svg>
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function loadDashboardData(): DashboardData {
  return {
    patients: mapPatients(),
    healthProfiles: mapHealthProfiles(),
    dietPreferences: mapDietPreferences(),
    foodNutrition: mapFoodNutrition(),
    exerciseTracking: mapExerciseTracking(),
  }
}

