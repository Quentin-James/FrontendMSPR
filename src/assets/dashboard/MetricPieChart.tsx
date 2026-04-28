import type { MetricPoint } from '../../types/dashboard-contracts'

interface MetricPieChartProps {
  data: MetricPoint[]
}

function MetricPieChart({ data }: MetricPieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return <p>Aucune donnée disponible.</p>

  const cx = 120
  const cy = 120
  const r = 100

  let cumAngle = -Math.PI / 2
  const slices = data.map((entry, i) => {
    const ratio = entry.value / total
    const startAngle = cumAngle
    const endAngle = cumAngle + ratio * 2 * Math.PI
    // eslint-disable-next-line react-hooks/immutability
    cumAngle = endAngle

    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0

    const midAngle = (startAngle + endAngle) / 2
    const lx = cx + r * 0.65 * Math.cos(midAngle)
    const ly = cy + r * 0.65 * Math.sin(midAngle)
    const pct = Math.round(ratio * 100)

    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
    return { path, colorIndex: i % 8, label: entry.label, value: entry.value, pct, lx, ly }
  })

  return (
    <div className="pie-chart-wrap">
      <svg viewBox="0 0 240 240" width="240" height="240" className="pie-svg">
        {slices.map((s) => (
          <path key={s.label} d={s.path} className={`pie-slice pie-slice-${s.colorIndex}`} strokeWidth="1.5">
            <title>{s.label}: {s.value} ({s.pct}%)</title>
          </path>
        ))}
        {slices.filter((s) => s.pct >= 5).map((s) => (
          <text key={s.label + '-pct'} x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle" className="pie-label">
            {s.pct}%
          </text>
        ))}
      </svg>
      <ul className="pie-legend">
        {slices.map((s) => (
          <li key={s.label}>
            <svg className="pie-dot" viewBox="0 0 12 12" width="12" height="12">
              <circle cx="6" cy="6" r="6" className={`pie-slice-${s.colorIndex}`} />
            </svg>
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MetricPieChart
