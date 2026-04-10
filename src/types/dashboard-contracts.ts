import type { DashboardData, DataAnomaly, DashboardKpis, WorkflowStatus } from './dashboard'

export type MetricKey = 'users' | 'nutrition' | 'fitness'

export interface MetricPoint {
  label: string
  value: number
}

export interface DashboardRepository {
  load(): DashboardData
}

export interface DashboardExporter {
  exportJson(data: DashboardData): void
  exportCsv(data: DashboardData): void
}

export interface DashboardAnalytics {
  detectAnomalies(data: DashboardData): DataAnomaly[]
  topAnomalies(anomalies: DataAnomaly[], count?: number): DataAnomaly[]
  computeKpis(data: DashboardData, unresolvedAnomalies: number): DashboardKpis
  userMetrics(data: DashboardData): MetricPoint[]
  nutritionMetrics(data: DashboardData): MetricPoint[]
  fitnessMetrics(data: DashboardData): MetricPoint[]
  ageBandMetrics(data: DashboardData['patients']): MetricPoint[]
  progressionMetrics(data: DashboardData['dietPreferences']): MetricPoint[]
  nutritionDeficitMetrics(data: DashboardData['foodNutrition']): MetricPoint[]
  intensityMetrics(data: DashboardData['exerciseTracking']): MetricPoint[]
  updateAnomalyValue(data: DashboardData, anomaly: DataAnomaly, newValue: string): DashboardData
}

export interface DashboardState {
  data: DashboardData
  workflowStatus: WorkflowStatus
  activeMetric: MetricKey
  editingAnomalyId: string | null
  draftFix: string
  resolvedIds: string[]
}

