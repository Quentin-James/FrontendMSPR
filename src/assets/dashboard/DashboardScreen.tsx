import AnomaliesPanel from './AnomaliesPanel'
import AnalyticsPanel from './AnalyticsPanel'
import ExportPanel from './ExportPanel'
import HeroHeader from './HeroHeader'
import KpiGrid from './KpiGrid'
import { useDashboardController } from '../../services/dashboard/useDashboardController'

function DashboardScreen() {
  const { state, kpis, topIssues, selectedMetrics,  insightMetrics, actions } =
    useDashboardController()

  return (
    <>
      <HeroHeader />
      <KpiGrid kpis={kpis} />
      <section className="split-panel">
        <AnomaliesPanel
          topIssues={topIssues}
          editingAnomalyId={state.editingAnomalyId}
          draftFix={state.draftFix}
          onDraftFixChange={actions.setDraftFix}
          onEditStart={actions.startEdit}
          onApplyFix={actions.applyFix}
          onResolve={actions.resolveAnomaly}
        />
        <ExportPanel
          data={state.data}
          kpis={kpis}
          onExportJson={actions.exportAsJson}
          onExportCsv={actions.exportAsCsv}
        />
      </section>

      <AnalyticsPanel
        activeMetric={state.activeMetric}
        selectedMetrics={selectedMetrics}
        onMetricChange={actions.setActiveMetric}
        ageBands={insightMetrics.ageBands}
        progression={insightMetrics.progression}
        nutritionDeficits={insightMetrics.nutritionDeficits}
        intensity={insightMetrics.intensity}
      />
    </>
  )
}

export default DashboardScreen

