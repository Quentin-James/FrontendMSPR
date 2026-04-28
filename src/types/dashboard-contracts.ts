import type { DashboardData, DataAnomaly, DashboardKpis } from './dashboard'

export type MetricKey = 'users' | 'nutrition' | 'fitness'

export interface MetricPoint {
  label: string
  value: number
}

export interface AgePyramidBand {
  label: string
  male: number
  female: number
}

export type CleaningTabKey = 'nutrition' | 'diet' | 'gym'
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
  exportJson(tab: CleaningTabKey, rows: CleaningRow[]): void
  exportCsv(tab: CleaningTabKey, rows: CleaningRow[]): void
}

export interface DashboardAnalytics {
  detectAnomalies(data: DashboardData): DataAnomaly[]
  topAnomalies(anomalies: DataAnomaly[], count?: number): DataAnomaly[]
  computeKpis(data: DashboardData, unresolvedAnomalies: number): DashboardKpis
  userMetrics(data: DashboardData): MetricPoint[]
  severityMetrics(data: DashboardData['healthProfiles']): MetricPoint[]
  agePyramidMetrics(data: DashboardData['patients']): AgePyramidBand[]
  bmiByDiseaseMetrics(
    patients: DashboardData['patients'],
    healthProfiles: DashboardData['healthProfiles'],
  ): MetricPoint[]
  nutritionMetrics(data: DashboardData): MetricPoint[]
  nutritionMealAverageMetrics(data: DashboardData): MetricPoint[]
  topNutritionFoodsMetrics(data: DashboardData, count?: number): MetricPoint[]
  fitnessMetrics(data: DashboardData): MetricPoint[]
  fitnessCaloriesByWorkoutMetrics(data: DashboardData['exerciseTracking']): MetricPoint[]
  fitnessAgeHistogramMetrics(data: DashboardData['exerciseTracking']): MetricPoint[]
  fitnessBmiByGenderMetrics(data: DashboardData['exerciseTracking']): MetricPoint[]
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

