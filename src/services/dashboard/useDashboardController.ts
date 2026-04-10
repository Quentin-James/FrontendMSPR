import { useMemo, useState } from 'react'
import { DashboardMockRepository } from '../../mock/dashboardMockRepository'
import type { DashboardState, MetricKey } from '../../types/dashboard-contracts'
import type { DashboardAnalytics, DashboardExporter, DashboardRepository, MetricPoint } from '../../types/dashboard-contracts'
import type { DataAnomaly } from '../../types/dashboard'
import { defaultDashboardAnalytics, defaultDashboardExporter } from './dependencies'

interface ControllerDependencies {
  repository?: DashboardRepository
  analytics?: DashboardAnalytics
  exporter?: DashboardExporter
}

function initialState(repository: DashboardRepository): DashboardState {
  return {
    data: repository.load(),
    activeMetric: 'users',
    editingAnomalyId: null,
    draftFix: '',
    resolvedIds: [],
  }
}

export function useDashboardController(dependencies: ControllerDependencies = {}) {
  const repository = dependencies.repository ?? new DashboardMockRepository()
  const analytics = dependencies.analytics ?? defaultDashboardAnalytics
  const exporter = dependencies.exporter ?? defaultDashboardExporter

  const [state, setState] = useState<DashboardState>(() => initialState(repository))

  const anomalies = useMemo(() => analytics.detectAnomalies(state.data), [analytics, state.data])

  const unresolvedAnomalies = useMemo(
    () => anomalies.filter((item) => !state.resolvedIds.includes(item.id)),
    [anomalies, state.resolvedIds],
  )

  const kpis = useMemo(
    () => analytics.computeKpis(state.data, unresolvedAnomalies.length),
    [analytics, state.data, unresolvedAnomalies.length],
  )

  const topIssues = useMemo(
    () => analytics.topAnomalies(unresolvedAnomalies, 10),
    [analytics, unresolvedAnomalies],
  )

  const metrics = useMemo(
    () => ({
      users: analytics.userMetrics(state.data),
      nutrition: analytics.nutritionMetrics(state.data),
      fitness: analytics.fitnessMetrics(state.data),
      business: [
        { label: 'Conversion premium (%)', value: kpis.premiumConversionRate },
        { label: 'Satisfaction estimee (%)', value: kpis.estimatedSatisfaction },
        { label: 'Score qualite (%)', value: kpis.qualityScore },
      ] satisfies MetricPoint[],
    }),
    [analytics, kpis, state.data],
  )

  const selectedMetrics = metrics[state.activeMetric]

  const insightMetrics = useMemo(
    () => ({
      ageBands: analytics.ageBandMetrics(state.data.patients),
      progression: analytics.progressionMetrics(state.data.dietPreferences),
      nutritionDeficits: analytics.nutritionDeficitMetrics(state.data.foodNutrition),
      intensity: analytics.intensityMetrics(state.data.exerciseTracking),
    }),
    [analytics, state.data],
  )

  function setActiveMetric(activeMetric: MetricKey): void {
    setState((current) => ({ ...current, activeMetric }))
  }

  function setDraftFix(draftFix: string): void {
    setState((current) => ({ ...current, draftFix }))
  }

  function startEdit(anomaly: DataAnomaly): void {
    setState((current) => ({ ...current, editingAnomalyId: anomaly.id, draftFix: anomaly.value }))
  }

  function applyFix(anomaly: DataAnomaly): void {
    setState((current) => {
      const nextData = analytics.updateAnomalyValue(current.data, anomaly, current.draftFix)
      const resolvedIds = current.resolvedIds.includes(anomaly.id)
        ? current.resolvedIds
        : [...current.resolvedIds, anomaly.id]

      return {
        ...current,
        data: nextData,
        resolvedIds,
        editingAnomalyId: null,
        draftFix: '',
      }
    })
  }

  function resolveAnomaly(anomalyId: string): void {
    setState((current) => ({
      ...current,
      resolvedIds: current.resolvedIds.includes(anomalyId)
        ? current.resolvedIds
        : [...current.resolvedIds, anomalyId],
    }))
  }

  function exportAsJson(): void {
    exporter.exportJson(state.data)
  }

  function exportAsCsv(): void {
    exporter.exportCsv(state.data)
  }

  return {
    state,
    kpis,
    topIssues,
    metrics,
    selectedMetrics,
    insightMetrics,
    actions: {
      setActiveMetric,
      setDraftFix,
      startEdit,
      applyFix,
      resolveAnomaly,
      exportAsJson,
      exportAsCsv,
    },
  }
}


