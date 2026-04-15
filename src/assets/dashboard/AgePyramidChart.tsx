import type { AgePyramidBand } from '../../types/dashboard-contracts'

interface AgePyramidChartProps {
  data: AgePyramidBand[]
}

function AgePyramidChart({ data }: AgePyramidChartProps) {
  if (data.length === 0) {
    return <p>Aucune donnée disponible.</p>
  }

  const maxSide = Math.max(
    ...data.map((item) => Math.max(item.male, item.female)),
    0,
  )

  return (
    <div className="age-pyramid">
      <div className="age-pyramid-head">
        <span>Hommes</span>
        <span>Tranches d'age</span>
        <span>Femmes</span>
      </div>
      {data.map((item) => {
        const left = maxSide === 0 ? 0 : (item.male / maxSide) * 100
        const right = maxSide === 0 ? 0 : (item.female / maxSide) * 100

        return (
          <div className="age-pyramid-row" key={item.label}>
            <div className="age-pyramid-side age-pyramid-side-left">
              <div className="age-pyramid-bar age-pyramid-bar-left" style={{ width: `${left}%` }} />
              <strong>{item.male}</strong>
            </div>
            <span className="age-pyramid-label">{item.label}</span>
            <div className="age-pyramid-side age-pyramid-side-right">
              <strong>{item.female}</strong>
              <div className="age-pyramid-bar age-pyramid-bar-right" style={{ width: `${right}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default AgePyramidChart
