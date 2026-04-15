import {
  agePyramidMetrics,
  ageBandMetrics,
  bmiByDiseaseMetrics,
  computeKpis,
  detectAnomalies,
  fitnessAgeHistogramMetrics,
  fitnessBmiByGenderMetrics,
  fitnessCaloriesByWorkoutMetrics,
  fitnessMetrics,
  intensityMetrics,
  nutritionDeficitMetrics,
  nutritionMetrics,
  nutritionMealAverageMetrics,
  progressionMetrics,
  severityMetrics,
  topAnomalies,
  topNutritionFoodsMetrics,
  updateAnomalyValue,
  userMetrics,
} from '../analytics'
import { exportCsv, exportJson } from '../export'
import type { DashboardAnalytics, DashboardExporter } from '../../types/dashboard-contracts'

export const defaultDashboardAnalytics: DashboardAnalytics = {
  detectAnomalies,
  topAnomalies,
  computeKpis,
  userMetrics,
  severityMetrics,
  agePyramidMetrics,
  bmiByDiseaseMetrics,
  nutritionMetrics,
  nutritionMealAverageMetrics,
  topNutritionFoodsMetrics,
  fitnessMetrics,
  fitnessCaloriesByWorkoutMetrics,
  fitnessAgeHistogramMetrics,
  fitnessBmiByGenderMetrics,
  ageBandMetrics,
  progressionMetrics,
  nutritionDeficitMetrics,
  intensityMetrics,
  updateAnomalyValue,
}

export const defaultDashboardExporter: DashboardExporter = {
  exportJson,
  exportCsv,
}

