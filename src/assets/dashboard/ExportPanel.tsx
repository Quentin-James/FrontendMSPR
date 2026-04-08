import type { DashboardData, DashboardKpis } from '../../types/dashboard'

interface ExportPanelProps {
  data: DashboardData
  kpis: DashboardKpis
  onExportJson: () => void
  onExportCsv: () => void
}

function ExportPanel({ data, kpis, onExportJson, onExportCsv }: ExportPanelProps) {
  return (
    <article className="panel">
      <div className="panel-head">
        <h2>Export des donnees nettoyees</h2>
        <small>JSON ou CSV pour services tiers</small>
      </div>
      <p>
        L&apos;export contient les donnees courantes apres corrections locales et clotures
        d&apos;anomalies.
      </p>
      <div className="export-actions">
        <button type="button" onClick={onExportJson}>
          Export JSON
        </button>
        <button type="button" onClick={onExportCsv}>
          Export CSV
        </button>
      </div>
      <ul className="quick-stats">
        <li>Age moyen: {kpis.avgAge}</li>
        <li>BMI moyen: {kpis.avgBmi}</li>
        <li>Calories quotidiennes moyennes: {kpis.avgDailyCalories}</li>
        <li>Adherence dietetique moyenne: {kpis.avgDietAdherenceScore}%</li>
        <li>Sessions exercice hebdo moyennes: {kpis.avgExerciseSessions}</li>
        <li>Satisfaction estimee: {kpis.estimatedSatisfaction}%</li>
        <li>Lignes datasets chargees: {Object.values(data).reduce((sum, rows) => sum + rows.length, 0)}</li>
      </ul>
    </article>
  )
}

export default ExportPanel

