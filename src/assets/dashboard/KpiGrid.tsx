import type { DashboardKpis } from '../../types/dashboard'

interface KpiGridProps {
  kpis: DashboardKpis
}

function KpiGrid({ kpis }: KpiGridProps) {
  return (
    <section className="kpi-grid">
      <article>
        <h3>Patients</h3>
        <strong>{kpis.totalPatients}</strong>
        <span>Total profils</span>
      </article>
      <article>
        <h3>Risque sante</h3>
        <strong>{kpis.highRiskProfiles}</strong>
        <span>Profils a surveiller</span>
      </article>
    </section>
  )
}

export default KpiGrid

