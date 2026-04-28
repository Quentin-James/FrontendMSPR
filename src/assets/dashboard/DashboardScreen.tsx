import AnomaliesPanel from './AnomaliesPanel'
import AnalyticsPanel from './AnalyticsPanel'
import ExportPanel from './ExportPanel'
import HeroHeader from './HeroHeader'
import KpiGrid from './KpiGrid'
import { useDashboardController } from '../../services/dashboard/useDashboardController'

function DashboardScreen() {
  const { state, cleaningColumns, selectedMetrics, insightMetrics, kpis, actions, paginatedRows } =
    useDashboardController()

  if (state.status === 'loading') {
    return <section className="panel">Chargement du dashboard...</section>
  }

  if (state.status === 'error') {
    return <section className="panel">Erreur: {state.errorMessage ?? 'chargement impossible'}</section>
  }

  return (
    <>
      <HeroHeader />
      <KpiGrid kpis={kpis} />
      <section className="split-panel">
        <AnomaliesPanel
          tabs={['nutrition', 'diet', 'gym']}
          activeTab={state.activeCleaningTab}
          columns={cleaningColumns}
          rows={paginatedRows}
          isLoading={state.isCleaningLoading}
          error={state.cleaningError}
          editingRowId={state.editingRowId}
          rowDraft={state.rowDraft}
          newRowDraft={state.newRowDraft}
          onTabChange={actions.setCleaningTab}
          onEditStart={actions.startEditRow}
          onEditCancel={actions.cancelEditRow}
          onRowDraftChange={actions.changeRowDraft}
          onSaveRow={actions.saveEditingRow}
          onDeleteRow={actions.deleteRow}
          onNewRowFieldChange={actions.changeNewRowField}
          onCreateRow={actions.createRow}
          page={state.page}
          pageSize={state.pageSize}
          totalRows={state.cleaningRows.length}
          onPageChange={actions.setPage}
          onPageSizeChange={actions.setPageSize}
        />
        <ExportPanel
          activeTab={state.activeCleaningTab}
          totalRows={state.cleaningRows.length}
          onExportJson={actions.exportAsJson}
          onExportCsv={actions.exportAsCsv}
        />
      </section>

      <AnalyticsPanel
        activeMetric={state.activeMetric}
        selectedMetrics={selectedMetrics}
        onMetricChange={actions.setActiveMetric}
        profileTotalPatients={insightMetrics.totalPatients}
        profileDiseaseDistribution={insightMetrics.profileDiseaseDistribution}
        profileSeverityDistribution={insightMetrics.profileSeverityDistribution}
        profileAgePyramid={insightMetrics.profileAgePyramid}
        profileBmiByDisease={insightMetrics.profileBmiByDisease}
        nutritionCategories={insightMetrics.nutritionCategories}
        nutritionMealAverages={insightMetrics.nutritionMealAverages}
        topNutritionFoods={insightMetrics.topNutritionFoods}
        fitnessCaloriesByWorkout={insightMetrics.fitnessCaloriesByWorkout}
        fitnessAgeHistogram={insightMetrics.fitnessAgeHistogram}
        fitnessBmiByGender={insightMetrics.fitnessBmiByGender}
      />
    </>
  )
}

export default DashboardScreen
