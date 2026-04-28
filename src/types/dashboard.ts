
export interface Patient {
  id: number
  age: number
  gender: string
  weightKg: number
  heightCm: number
  bmi: number
}

export interface HealthProfile {
  id: number
  patientId: number
  diseaseType: string
  severity: string
  physicalActivityLevel: string
  dailyCaloricIntake: number
  cholesterolMgDl: number
  bloodPressureMmhg: string
  glucoseMgDl: number
}

export interface DietPreference {
  id: number
  patientId: number
  dietaryRestrictions: string
  allergies: string
  preferredCuisine: string
  weeklyExerciseFrequency: number
  adherenceToDiet: string
}

export interface FoodNutrition {
  id: number
  foodItem: string
  category: string
  caloriesKcal: number
  proteinG: number
  carbohydratesG: number
  fatG: number
  fiberG: number
  sugarsG: number
  sodiumMg: number
  cholesterolMg: number
  mealType: string
  waterIntakeMl: number
}

export interface ExerciseTracking {
  id: number
  age: number
  gender: string
  weightKg: number
  heightM: number
  maxBpm: number
  avgBpm: number
  restingBpm: number
  sessionDurationHours: number
  caloriesBurned: number
  workoutType: string
  fatPercentage: number
  waterIntakeLiters: number
  workoutFrequencyDaysWeek: number
  experienceLevel: string
  bmi: number
}

export interface DashboardData {
  patients: Patient[]
  healthProfiles: HealthProfile[]
  dietPreferences: DietPreference[]
  foodNutrition: FoodNutrition[]
  exerciseTracking: ExerciseTracking[]
}

export interface DataAnomaly {
  id: string
  dataset: keyof DashboardData
  recordId: number
  field: string
  value: string
  issue: string
  severity: 'high' | 'medium' | 'low'
  fixed: boolean
}

export interface DashboardKpis {
  totalPatients: number
  avgAge: number
  avgBmi: number
  qualityScore: number
  anomalyCount: number
  highRiskProfiles: number
  avgDietAdherenceScore: number
  avgExerciseSessions: number
  avgDailyCalories: number
  premiumConversionRate: number
  estimatedSatisfaction: number
}

