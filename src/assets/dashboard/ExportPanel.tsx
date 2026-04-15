import type { CleaningTabKey } from '../../types/dashboard-contracts'

interface ExportPanelProps {
  activeTab: CleaningTabKey
  totalRows: number
  onExportJson: () => void
  onExportCsv: () => void
}

const tabLabels: Record<CleaningTabKey, string> = {
  nutrition: 'Nutrition',
  diet: 'Regimes',
  gym: 'Entrainements',
}

function ExportPanel({ activeTab, totalRows, onExportJson, onExportCsv }: ExportPanelProps) {
  return (
    <article className="panel">
      <div className="panel-head">
        <h2>Export des donnees nettoyees</h2>
        <small>{tabLabels[activeTab]}</small>
      </div>
      <p>{totalRows} lignes de l'onglet actif seront exportees.</p>
      <div className="export-actions">
        <button type="button" onClick={onExportJson}>
          Export JSON
        </button>
        <button type="button" onClick={onExportCsv}>
          Export CSV
        </button>
      </div>
    </article>
  )
}

export default ExportPanel

