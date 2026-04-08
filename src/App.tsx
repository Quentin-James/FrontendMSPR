import { useMemo, useState } from 'react'
import './App.css'
import { NutritionPieChart } from './services/dashboardData'
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

function App() {
  const [data, setData] = useState(loadDashboardData)
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>('draft')
  const [activeMetric, setActiveMetric] = useState<'users' | 'nutrition' | 'fitness' | 'business'>('users')
  const [editingAnomalyId, setEditingAnomalyId] = useState<string | null>(null)
  const [draftFix, setDraftFix] = useState('')
  const [resolvedIds, setResolvedIds] = useState<string[]>([])

  const anomalies = useMemo(() => detectAnomalies(data), [data])
  const unresolvedAnomalies = useMemo(
    () => anomalies.filter((item) => !resolvedIds.includes(item.id)),
    [anomalies, resolvedIds],
  )
  const topIssues = useMemo(() => topAnomalies(unresolvedAnomalies, 10), [unresolvedAnomalies])
  const kpis = useMemo(() => computeKpis(data, unresolvedAnomalies.length), [data, unresolvedAnomalies])

  const usersData = useMemo(() => userMetrics(data), [data])
  const nutritionData = useMemo(() => nutritionMetrics(data), [data])
  const fitnessData = useMemo(() => fitnessMetrics(data), [data])
  const businessData = useMemo(
    () => [
      { label: 'Conversion premium (%)', value: kpis.premiumConversionRate },
      { label: 'Satisfaction estimee (%)', value: kpis.estimatedSatisfaction },
      { label: 'Score qualite (%)', value: kpis.qualityScore },
    ],
    [kpis],
  )

  const maxChartValue = useMemo(() => {
    const selected =
      activeMetric === 'users'
        ? usersData
        : activeMetric === 'nutrition'
          ? nutritionData
          : activeMetric === 'fitness'
            ? fitnessData
            : businessData

    return Math.max(...selected.map((entry) => entry.value), 1)
  }, [activeMetric, businessData, fitnessData, nutritionData, usersData])

  function openEdit(anomaly: DataAnomaly): void {
    setEditingAnomalyId(anomaly.id)
    setDraftFix(anomaly.value)
  }

  function applyFix(anomaly: DataAnomaly): void {
    const nextData = updateAnomalyValue(data, anomaly, draftFix)
    setData(nextData)
    setResolvedIds((current) => [...current, anomaly.id])
    setEditingAnomalyId(null)
    setDraftFix('')
  }

  function markResolved(anomalyId: string): void {
    setResolvedIds((current) => (current.includes(anomalyId) ? current : [...current, anomalyId]))
  }

  const workflowProgress =
    workflowStatus === 'draft' ? 33 : workflowStatus === 'in_review' ? 66 : 100

  return (
    <main className="dashboard">
      <header className="hero-head">
        <div>
          <h1>Administration & Analytics</h1>
          <p>
            Pilotage qualite des donnees, workflow de validation et insights business sur les jeux
            de donnees mockes.
          </p>
        </div>
        <div className="api-note">
          <h2>API REST (cible)</h2>
          <p>
            Le backend n&apos;est pas encore branche. Cette interface prepare le terrain pour des
            endpoints CRUD securises et documentes via OpenAPI.
          </p>
        </div>
      </header>

      <section className="kpi-grid">
        <article>
          <h3>Patients</h3>
          <strong>{kpis.totalPatients}</strong>
          <span>Total profils</span>
        </article>
        <article>
          <h3>Qualite donnees</h3>
          <strong>{kpis.qualityScore}%</strong>
          <span>{kpis.anomalyCount} anomalies ouvertes</span>
        </article>
        <article>
          <h3>Risque sante</h3>
          <strong>{kpis.highRiskProfiles}</strong>
          <span>Profils a surveiller</span>
        </article>
        <article>
          <h3>Engagement</h3>
          <strong>{kpis.premiumConversionRate}%</strong>
          <span>Conversion premium estimee</span>
        </article>
      </section>

      <section className="workflow">
        <div>
          <h2>Workflow de validation</h2>
          <p>
            Statut courant: <strong>{workflowStatus}</strong>
          </p>
          <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={workflowProgress}>
            <div className="progress-fill" style={{ width: `${workflowProgress}%` }} />
          </div>
        </div>
        <div className="workflow-actions">
          <button type="button" onClick={() => setWorkflowStatus('draft')}>
            Brouillon
          </button>
          <button type="button" onClick={() => setWorkflowStatus('in_review')}>
            Mettre en revue
          </button>
          <button type="button" onClick={() => setWorkflowStatus('approved')}>
            Approuver
          </button>
        </div>
      </section>

      <section className="split-panel">
        <article className="panel">
          <div className="panel-head">
            <h2>Nettoyage interactif des anomalies</h2>
            <small>{topIssues.length} anomalies prioritaires affichees</small>
          </div>
          <table>
            <thead>
              <tr>
                <th>Dataset</th>
                <th>ID</th>
                <th>Champ</th>
                <th>Valeur</th>
                <th>Probleme</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {topIssues.map((issue) => (
                <tr key={issue.id}>
                  <td>{issue.dataset}</td>
                  <td>{issue.recordId}</td>
                  <td>{issue.field}</td>
                  <td>
                    {editingAnomalyId === issue.id ? (
                      <input value={draftFix} onChange={(event) => setDraftFix(event.target.value)} />
                    ) : (
                      issue.value
                    )}
                  </td>
                  <td>
                    <span className={`severity ${issue.severity}`}>{issue.severity}</span>
                    {issue.issue}
                  </td>
                  <td>
                    {editingAnomalyId === issue.id ? (
                      <button type="button" onClick={() => applyFix(issue)}>
                        Valider correction
                      </button>
                    ) : (
                      <button type="button" onClick={() => openEdit(issue)}>
                        Editer
                      </button>
                    )}
                    <button type="button" onClick={() => markResolved(issue.id)}>
                      Cloturer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

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
            <button type="button" onClick={() => exportJson(data)}>
              Export JSON
            </button>
            <button type="button" onClick={() => exportCsv(data)}>
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
          </ul>
        </article>
      </section>

      <section className="panel analytics">
        <div className="panel-head">
          <h2>Analytics & visualisation business</h2>
          <small>Vue metriques utilisateurs, nutrition, fitness et business</small>
        </div>
        <div className="metric-tabs">
          <button type="button" onClick={() => setActiveMetric('users')} className={activeMetric === 'users' ? 'active' : ''}>
            Utilisateurs
          </button>
          <button type="button" onClick={() => setActiveMetric('nutrition')} className={activeMetric === 'nutrition' ? 'active' : ''}>
            Nutrition
          </button>
          <button type="button" onClick={() => setActiveMetric('fitness')} className={activeMetric === 'fitness' ? 'active' : ''}>
            Fitness
          </button>
          <button type="button" onClick={() => setActiveMetric('business')} className={activeMetric === 'business' ? 'active' : ''}>
            Business
          </button>
        </div>

        {activeMetric === 'nutrition' ? (
          <NutritionPieChart data={nutritionData} />
        ) : (
          <div className="bars">
            {(activeMetric === 'users'
              ? usersData
              : activeMetric === 'fitness'
                ? fitnessData
                : businessData
            ).map((entry) => (
              <div key={entry.label} className="bar-row">
                <span>{entry.label}</span>
                <div>
                  <div style={{ width: `${(entry.value / maxChartValue) * 100}%` }} />
                </div>
                <strong>{entry.value}</strong>
              </div>
            ))}
          </div>
        )}

        <div className="insights-grid">
          <article>
            <h3>Repartition par age</h3>
            <ul>
              {ageBandMetrics(data.patients).map((item) => (
                <li key={item.label}>
                  {item.label}: {item.value}
                </li>
              ))}
            </ul>
          </article>
          <article>
            <h3>Progression (adherence)</h3>
            <ul>
              {progressionMetrics(data.dietPreferences).map((item) => (
                <li key={item.label}>
                  {item.label}: {item.value}
                </li>
              ))}
            </ul>
          </article>
          <article>
            <h3>Tendances nutritionnelles</h3>
            <ul>
              {nutritionDeficitMetrics(data.foodNutrition).map((item) => (
                <li key={item.label}>
                  {item.label}: {item.value}
                </li>
              ))}
            </ul>
          </article>
          <article>
            <h3>Niveaux d'intensite</h3>
            <ul>
              {intensityMetrics(data.exerciseTracking).map((item) => (
                <li key={item.label}>
                  {item.label}: {item.value}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </main>
  )
}

export default App
