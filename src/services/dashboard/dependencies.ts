import {
  ageBandMetrics,
  computeKpis,
  detectAnomalies,
  fitnessMetrics,
  intensityMetrics,
  nutritionDeficitMetrics,
  nutritionMetrics,
  progressionMetrics,
  topAnomalies,
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
  nutritionMetrics,
  fitnessMetrics,
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

