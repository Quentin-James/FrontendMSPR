import type { MetricKey, MetricPoint } from '../../types/dashboard-contracts'

interface AnalyticsPanelProps {
  activeMetric: MetricKey
  selectedMetrics: MetricPoint[]
  maxChartValue: number
  onMetricChange: (metric: MetricKey) => void
  ageBands: MetricPoint[]
  progression: MetricPoint[]
  nutritionDeficits: MetricPoint[]
  intensity: MetricPoint[]
}

function AnalyticsPanel({
  activeMetric,
  selectedMetrics,
  maxChartValue,
  onMetricChange,
  ageBands,
  progression,
  nutritionDeficits,
  intensity,
}: AnalyticsPanelProps) {
  return (
    <section className="panel analytics">
      <div className="panel-head">
        <h2>Analytics & visualisation business</h2>
        <small>Vue metriques utilisateurs, nutrition, fitness et business</small>
      </div>

      <div className="metric-tabs">
        <button
          type="button"
          onClick={() => onMetricChange('users')}
          className={activeMetric === 'users' ? 'active' : ''}
        >
          Utilisateurs
        </button>
        <button
          type="button"
          onClick={() => onMetricChange('nutrition')}
          className={activeMetric === 'nutrition' ? 'active' : ''}
        >
          Nutrition
        </button>
        <button
          type="button"
          onClick={() => onMetricChange('fitness')}
          className={activeMetric === 'fitness' ? 'active' : ''}
        >
          Fitness
        </button>
        <button
          type="button"
          onClick={() => onMetricChange('business')}
          className={activeMetric === 'business' ? 'active' : ''}
        >
          Business
        </button>
      </div>

      <div className="bars">
        {selectedMetrics.map((entry) => (
          <div key={entry.label} className="bar-row">
            <span>{entry.label}</span>
            <div>
              <div style={{ width: `${(entry.value / maxChartValue) * 100}%` }} />
            </div>
            <strong>{entry.value}</strong>
          </div>
        ))}
      </div>

      <div className="insights-grid">
        <article>
          <h3>Repartition par age</h3>
          <ul>
            {ageBands.map((item) => (
              <li key={item.label}>
                {item.label}: {item.value}
              </li>
            ))}
          </ul>
        </article>
        <article>
          <h3>Progression (adherence)</h3>
          <ul>
            {progression.map((item) => (
              <li key={item.label}>
                {item.label}: {item.value}
              </li>
            ))}
          </ul>
        </article>
        <article>
          <h3>Tendances nutritionnelles</h3>
          <ul>
            {nutritionDeficits.map((item) => (
              <li key={item.label}>
                {item.label}: {item.value}
              </li>
            ))}
          </ul>
        </article>
        <article>
          <h3>Niveaux d'intensite</h3>
          <ul>
            {intensity.map((item) => (
              <li key={item.label}>
                {item.label}: {item.value}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}

export default AnalyticsPanel

