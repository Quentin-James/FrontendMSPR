import type { DashboardData, DataAnomaly, DashboardKpis } from './dashboard'

export type MetricKey = 'users' | 'nutrition' | 'fitness'

export interface MetricPoint {
  label: string
  value: number
}

export type CleaningTabKey = 'nutrition'
export type CleaningCellValue = string | number | boolean | null
export type CleaningRow = Record<string, CleaningCellValue>

export interface DashboardRepository {
  load(): Promise<DashboardData>
  loadCleaningTab(tab: CleaningTabKey): Promise<CleaningRow[]>
  createCleaningRow(tab: CleaningTabKey, payload: CleaningRow): Promise<CleaningRow>
  updateCleaningRow(tab: CleaningTabKey, id: number, payload: CleaningRow): Promise<CleaningRow>
  deleteCleaningRow(tab: CleaningTabKey, id: number): Promise<void>
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
  status: 'loading' | 'ready' | 'error'
  errorMessage: string | null
  activeMetric: MetricKey
  activeCleaningTab: CleaningTabKey
  cleaningRows: CleaningRow[]
  isCleaningLoading: boolean
  cleaningError: string | null
  editingRowId: number | null
  rowDraft: Record<string, string>
  newRowDraft: Record<string, string>
  page:number;
  pageSize:number;
}

