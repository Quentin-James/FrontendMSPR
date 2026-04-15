import type { AgePyramidBand, MetricKey, MetricPoint } from '../../types/dashboard-contracts'
import AgePyramidChart from './AgePyramidChart'
import MetricPieChart from './MetricPieChart'
import MetricBars from './MetricBars'

interface AnalyticsPanelProps {
  activeMetric: MetricKey
  selectedMetrics: MetricPoint[]
  onMetricChange: (metric: MetricKey) => void
  profileTotalPatients: number
  profileDiseaseDistribution: MetricPoint[]
  profileSeverityDistribution: MetricPoint[]
  profileAgePyramid: AgePyramidBand[]
  profileBmiByDisease: MetricPoint[]
  nutritionCategories: MetricPoint[]
  nutritionMealAverages: MetricPoint[]
  topNutritionFoods: MetricPoint[]
  fitnessCaloriesByWorkout: MetricPoint[]
  fitnessAgeHistogram: MetricPoint[]
  fitnessBmiByGender: MetricPoint[]
}

function AnalyticsPanel({
  activeMetric,
  selectedMetrics,
  onMetricChange,
  profileTotalPatients,
  profileDiseaseDistribution,
  profileSeverityDistribution,
  profileAgePyramid,
  profileBmiByDisease,
  nutritionCategories,
  nutritionMealAverages,
  topNutritionFoods,
  fitnessCaloriesByWorkout,
  fitnessAgeHistogram,
  fitnessBmiByGender,
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
          Profils Sante
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
      </div>

      <div className="insights-grid">
        {activeMetric === 'users' && (
          <>
            <article>
              <h3>Profils sante</h3>
              <p className="profile-total">Total patients: {profileTotalPatients}</p>
            </article>
            <article>
              <h3>Repartition par maladie</h3>
              <MetricPieChart data={profileDiseaseDistribution} />
            </article>
            <article>
              <h3>Repartition par severite</h3>
              <MetricBars data={profileSeverityDistribution} orientation="horizontal" />
            </article>
            <article>
              <h3>Pyramide des ages</h3>
              <AgePyramidChart data={profileAgePyramid} />
            </article>
            <article>
              <h3>BMI moyen par maladie</h3>
              <MetricBars data={profileBmiByDisease} orientation="horizontal" />
            </article>
          </>
        )}
        {activeMetric === 'fitness' && (
          <>
            <article>
              <h3>Repartition par type de workout</h3>
              <MetricPieChart data={selectedMetrics} />
            </article>
            <article>
              <h3>Calories brulees moyennes par workout</h3>
              <MetricBars data={fitnessCaloriesByWorkout} orientation="vertical" valueSuffix="kcal" />
            </article>
            <article>
              <h3>Distribution des ages des membres</h3>
              <MetricBars data={fitnessAgeHistogram} orientation="vertical" />
            </article>
            <article>
              <h3>BMI moyen par genre</h3>
              <MetricBars data={fitnessBmiByGender} orientation="vertical" valueSuffix="BMI" />
            </article>
          </>
        )}
        {activeMetric === 'nutrition' && (
          <>
            <article>
              <h3>Repartition des aliments par categorie</h3>
              <MetricPieChart data={nutritionCategories} />
            </article>
            <article>
              <h3>Calories moyennes par type de repas</h3>
              <MetricBars data={nutritionMealAverages} orientation="vertical" valueSuffix="kcal" />
            </article>
            <article>
              <h3>Top aliments les plus caloriques</h3>
              <MetricBars data={topNutritionFoods} orientation="horizontal" valueSuffix="kcal" />
            </article>
          </>
        )}
      </div>
    </section>
  )
}

export default AnalyticsPanel

