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
} from './services/analytics'
import { loadDashboardData } from './services/dashboardData'
import { exportCsv, exportJson } from './services/export'
import type { DataAnomaly, WorkflowStatus } from './types/dashboard'

export interface DashboardLogicState {
  data: ReturnType<typeof loadDashboardData>
  workflowStatus: WorkflowStatus
  activeMetric: 'users' | 'nutrition' | 'fitness' | 'business'
  editingAnomalyId: string | null
  draftFix: string
  resolvedIds: string[]
}

export function getInitialDashboardLogicState(): DashboardLogicState {
  return {
    data: loadDashboardData(),
    workflowStatus: 'draft',
    activeMetric: 'users',
    editingAnomalyId: null,
    draftFix: '',
    resolvedIds: [],
  }
}

export function getDashboardComputed(state: DashboardLogicState) {
  const anomalies = detectAnomalies(state.data)
  const unresolvedAnomalies = anomalies.filter((item) => !state.resolvedIds.includes(item.id))
  const topIssues = topAnomalies(unresolvedAnomalies, 10)
  const kpis = computeKpis(state.data, unresolvedAnomalies.length)
  const usersData = userMetrics(state.data)
  const nutritionData = nutritionMetrics(state.data)
  const fitnessData = fitnessMetrics(state.data)
  const businessData = [
    { label: 'Conversion premium (%)', value: kpis.premiumConversionRate },
    { label: 'Satisfaction estimee (%)', value: kpis.estimatedSatisfaction },
    { label: 'Score qualite (%)', value: kpis.qualityScore },
  ]
  const maxChartValue = Math.max(
    ...(
      state.activeMetric === 'users'
        ? usersData
        : state.activeMetric === 'nutrition'
        ? nutritionData
        : state.activeMetric === 'fitness'
        ? fitnessData
        : businessData
    ).map((entry) => entry.value),
    1,
  )
  return {
    anomalies,
    unresolvedAnomalies,
    topIssues,
    kpis,
    usersData,
    nutritionData,
    fitnessData,
    businessData,
    maxChartValue,
  }
}

export function openEdit(state: DashboardLogicState, anomaly: DataAnomaly): DashboardLogicState {
  return { ...state, editingAnomalyId: anomaly.id, draftFix: anomaly.value }
}

export function applyFix(state: DashboardLogicState, anomaly: DataAnomaly): DashboardLogicState {
  const nextData = updateAnomalyValue(state.data, anomaly, state.draftFix)
  return {
    ...state,
    data: nextData,
    resolvedIds: [...state.resolvedIds, anomaly.id],
    editingAnomalyId: null,
    draftFix: '',
  }
}

export function markResolved(state: DashboardLogicState, anomalyId: string): DashboardLogicState {
  return {
    ...state,
    resolvedIds: state.resolvedIds.includes(anomalyId)
      ? state.resolvedIds
      : [...state.resolvedIds, anomalyId],
  }
}

export function getWorkflowProgress(status: WorkflowStatus): number {
  return status === 'draft' ? 33 : status === 'in_review' ? 66 : 100
}

export {
  ageBandMetrics,
  progressionMetrics,
  nutritionDeficitMetrics,
  intensityMetrics,
  exportCsv,
  exportJson,
}

