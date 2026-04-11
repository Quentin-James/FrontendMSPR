import { useEffect, useMemo, useState } from 'react'
import { DashboardMockRepository } from '../../mock/dashboardMockRepository'
import type {
  CleaningRow,
  CleaningTabKey,
  DashboardState,
  MetricKey,
} from '../../types/dashboard-contracts'
import type { DashboardAnalytics, DashboardExporter, DashboardRepository} from '../../types/dashboard-contracts'
import type { DashboardData } from '../../types/dashboard'
import { defaultDashboardAnalytics, defaultDashboardExporter } from './dependencies'

interface ControllerDependencies {
  repository?: DashboardRepository
  analytics?: DashboardAnalytics
  exporter?: DashboardExporter
}

const emptyData: DashboardData = {
  patients: [],
  healthProfiles: [],
  dietPreferences: [],
  foodNutrition: [],
  exerciseTracking: [],
}

function initialState(): DashboardState {
  return {
    data: emptyData,
    status: 'loading',
    errorMessage: null,
    activeMetric: 'users',
    activeCleaningTab: 'nutrition',
    cleaningRows: [],
    isCleaningLoading: true,
    cleaningError: null,
    editingRowId: null,
    rowDraft: {},
    newRowDraft: {},
    page: 1, // pagination: page courante
    pageSize: 20, // pagination: taille de page par défaut
  }
}

function toInputValue(value: CleaningRow[string] | undefined): string {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

function fromInputValue(raw: string): CleaningRow[string] {
  if (raw.trim() === '') {
    return ''
  }

  if (raw.toLowerCase() === 'true') return true
  if (raw.toLowerCase() === 'false') return false

  const numeric = Number(raw)
  return Number.isFinite(numeric) && raw.trim() !== '' ? numeric : raw
}

export function useDashboardController(dependencies: ControllerDependencies = {}) {
  const repository = useMemo(
    () => dependencies.repository ?? new DashboardMockRepository(),
    [dependencies.repository],
  )
  const analytics = useMemo(
    () => dependencies.analytics ?? defaultDashboardAnalytics,
    [dependencies.analytics],
  )
  const exporter = useMemo(
    () => dependencies.exporter ?? defaultDashboardExporter,
    [dependencies.exporter],
  )

  const [state, setState] = useState<DashboardState>(() => initialState())

  useEffect(() => {
    let active = true

    repository
      .load()
      .then((data) => {
        if (!active) return
        setState((current) => ({
          ...current,
          data,
          status: 'ready',
          errorMessage: null,
          page:1,
          pageSize:10,
        }))
      })
      .catch((error: unknown) => {
        if (!active) return
        const message = error instanceof Error ? error.message : 'Chargement du dashboard impossible'
        setState((current) => ({
          ...current,
          status: 'error',
          errorMessage: message,
        }))
      })

    return () => {
      active = false
    }
  }, [repository])

  useEffect(() => {
    let active = true

    repository
      .loadCleaningTab(state.activeCleaningTab)
      .then((rows) => {
        if (!active) return
        setState((current) => ({
          ...current,
          cleaningRows: rows,
          isCleaningLoading: false,
          cleaningError: null,
        }))
      })
      .catch((error: unknown) => {
        if (!active) return
        const message = error instanceof Error ? error.message : 'Chargement des donnees impossible'
        setState((current) => ({
          ...current,
          isCleaningLoading: false,
          cleaningError: message,
        }))
      })

    return () => {
      active = false
    }
  }, [repository, state.activeCleaningTab])

  const anomalies = useMemo(() => analytics.detectAnomalies(state.data), [analytics, state.data])

  const kpis = useMemo(
    () => analytics.computeKpis(state.data, anomalies.length),
    [analytics, state.data, anomalies.length],
  )

  const metrics = useMemo(
    () => ({
      users: analytics.userMetrics(state.data),
      nutrition: analytics.nutritionMetrics(state.data),
      fitness: analytics.fitnessMetrics(state.data),
    }),
    [analytics, state.data],
  )

  const selectedMetrics = metrics[state.activeMetric]

  const cleaningColumns = useMemo(() => {
    const keys = new Set<string>()
    state.cleaningRows.forEach((row) => {
      Object.keys(row).forEach((key) => keys.add(key))
    })

    const sorted = [...keys].sort((left, right) => {
      if (left === 'id') return -1
      if (right === 'id') return 1
      return left.localeCompare(right)
    })

    return sorted
  }, [state.cleaningRows])

  const insightMetrics = useMemo(
    () => ({
      ageBands: analytics.ageBandMetrics(state.data.patients),
      progression: analytics.progressionMetrics(state.data.dietPreferences),
      nutritionDeficits: analytics.nutritionDeficitMetrics(state.data.foodNutrition),
      intensity: analytics.intensityMetrics(state.data.exerciseTracking),
    }),
    [analytics, state.data],
  )
  const paginatedRows = useMemo(() => {
    const start = (state.page - 1) * state.pageSize
    return state.cleaningRows.slice(start, start + state.pageSize)
  }, [state.cleaningRows, state.page, state.pageSize])

  function setActiveMetric(activeMetric: MetricKey): void {
    setState((current) => ({ ...current, activeMetric }))
  }

  function setCleaningTab(tab: CleaningTabKey): void {
    setState((current) => ({
      ...current,
      activeCleaningTab: tab,
      isCleaningLoading: true,
      cleaningError: null,
      editingRowId: null,
      rowDraft: {},
      newRowDraft: {},
    }))
  }

  function startEditRow(row: CleaningRow): void {
    const id = Number(row.id)
    if (!Number.isFinite(id)) {
      return
    }

    const draft = Object.entries(row).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = toInputValue(value)
      return acc
    }, {})

    setState((current) => ({
      ...current,
      editingRowId: id,
      rowDraft: draft,
    }))
  }

  function cancelEditRow(): void {
    setState((current) => ({ ...current, editingRowId: null, rowDraft: {} }))
  }

  function changeRowDraft(field: string, value: string): void {
    setState((current) => ({
      ...current,
      rowDraft: {
        ...current.rowDraft,
        [field]: value,
      },
    }))
  }

  async function saveEditingRow(): Promise<void> {
    const id = state.editingRowId
    if (id === null) {
      return
    }

    const payload = Object.entries(state.rowDraft).reduce<CleaningRow>((acc, [key, value]) => {
      acc[key] = fromInputValue(value)
      return acc
    }, {})

    const updated = await repository.updateCleaningRow(state.activeCleaningTab, id, payload)

    setState((current) => ({
      ...current,
      cleaningRows: current.cleaningRows.map((row) => (Number(row.id) === id ? updated : row)),
      editingRowId: null,
      rowDraft: {},
    }))
  }

  async function deleteRow(id: number): Promise<void> {
    await repository.deleteCleaningRow(state.activeCleaningTab, id)
    setState((current) => ({
      ...current,
      cleaningRows: current.cleaningRows.filter((row) => Number(row.id) !== id),
    }))
  }

  function changeNewRowField(field: string, value: string): void {
    setState((current) => ({
      ...current,
      newRowDraft: {
        ...current.newRowDraft,
        [field]: value,
      },
    }))
  }

  async function createRow(): Promise<void> {
    const payload = Object.entries(state.newRowDraft).reduce<CleaningRow>((acc, [key, value]) => {
      if (key !== 'id') {
        acc[key] = fromInputValue(value)
      }
      return acc
    }, {})

    const created = await repository.createCleaningRow(state.activeCleaningTab, payload)
    setState((current) => ({
      ...current,
      cleaningRows: [...current.cleaningRows, created],
      newRowDraft: {},
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
    topIssues: analytics.topAnomalies(anomalies, 10),
    cleaningColumns,
    metrics,
    selectedMetrics,
    insightMetrics,
    paginatedRows, // exporte les lignes paginées
    actions: {
      setActiveMetric,
      setCleaningTab,
      startEditRow,
      cancelEditRow,
      changeRowDraft,
      saveEditingRow,
      deleteRow,
      changeNewRowField,
      createRow,
      exportAsJson,
      exportAsCsv,
      setPage, // handler pagination
      setPageSize, // handler pagination
    },
  }
  function setPage(page: number): void {
    setState((current) => ({
      ...current,
      page,
    }))
  }

  function setPageSize(pageSize: number): void {
    setState((current) => ({
      ...current,
      pageSize,
      page: 1, // reset page à 1 si on change la taille
    }))
  }
}


