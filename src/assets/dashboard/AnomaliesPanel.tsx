import type { DataAnomaly } from '../../types/dashboard'

interface AnomaliesPanelProps {
  topIssues: DataAnomaly[]
  editingAnomalyId: string | null
  draftFix: string
  onDraftFixChange: (value: string) => void
  onEditStart: (anomaly: DataAnomaly) => void
  onApplyFix: (anomaly: DataAnomaly) => void
  onResolve: (anomalyId: string) => void
}

function AnomaliesPanel({
  topIssues,
  editingAnomalyId,
  draftFix,
  onDraftFixChange,
  onEditStart,
  onApplyFix,
  onResolve,
}: AnomaliesPanelProps) {
  return (
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
                  <input
                    value={draftFix}
                    onChange={(event) => onDraftFixChange(event.target.value)}
                  />
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
                  <button type="button" onClick={() => onApplyFix(issue)}>
                    Valider correction
                  </button>
                ) : (
                  <button type="button" onClick={() => onEditStart(issue)}>
                    Editer
                  </button>
                )}
                <button type="button" onClick={() => onResolve(issue.id)}>
                  Cloturer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  )
}

export default AnomaliesPanel

