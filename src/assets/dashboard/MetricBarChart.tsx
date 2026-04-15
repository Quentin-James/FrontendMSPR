import type { MetricPoint } from '../../types/dashboard-contracts'

interface MetricBarChartProps {
  data: MetricPoint[]
  orientation?: 'vertical' | 'horizontal'
  valueSuffix?: string
}

function MetricBarChart({ data, orientation = 'vertical', valueSuffix = '' }: MetricBarChartProps) {
  if (data.length === 0) {
    return <p>Aucune donnée disponible.</p>
  }

  const maxValue = Math.max(...data.map((item) => item.value), 0)

  if (orientation === 'horizontal') {
    return (
      <div className="bar-chart bar-chart-horizontal">
        {data.map((item) => {
          const width = maxValue === 0 ? 0 : (item.value / maxValue) * 100

          return (
            <div className="bar-chart-row bar-chart-row-horizontal" key={item.label}>
              <span className="bar-chart-label">{item.label}</span>
              <div className="bar-chart-track">
                <div className="bar-chart-fill" style={{ width: `${width}%` }} />
              </div>
              <strong className="bar-chart-value">
                {item.value}
                {valueSuffix ? ` ${valueSuffix}` : ''}
              </strong>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="bar-chart bar-chart-vertical">
      {data.map((item) => {
        const height = maxValue === 0 ? 0 : (item.value / maxValue) * 100

        return (
          <div className="bar-chart-column" key={item.label}>
            <strong className="bar-chart-value">
              {item.value}
              {valueSuffix ? ` ${valueSuffix}` : ''}
            </strong>
            <div className="bar-chart-track bar-chart-track-vertical">
              <div className="bar-chart-fill bar-chart-fill-vertical" style={{ height: `${height}%` }} />
            </div>
            <span className="bar-chart-label bar-chart-label-centered">{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default MetricBarChart