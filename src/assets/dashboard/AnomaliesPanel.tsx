import type { CleaningRow, CleaningTabKey } from '../../types/dashboard-contracts'

const tabLabels: Record<CleaningTabKey, string> = {
  nutrition: 'Nutrition',
  diet: 'Régimes',
  gym: 'Entraînements',
}

interface AnomaliesPanelProps {
  tabs: CleaningTabKey[]
  activeTab: CleaningTabKey
  columns: string[]
  rows: CleaningRow[]
  isLoading: boolean
  error: string | null
  editingRowId: number | null
  rowDraft: Record<string, string>
  newRowDraft: Record<string, string>
  onTabChange: (tab: CleaningTabKey) => void
  onEditStart: (row: CleaningRow) => void
  onEditCancel: () => void
  onRowDraftChange: (field: string, value: string) => void
  onSaveRow: () => Promise<void>
  onDeleteRow: (id: number) => Promise<void>
  onNewRowFieldChange: (field: string, value: string) => void
  onCreateRow: () => Promise<void>
  page: number
  pageSize: number
  totalRows: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

function AnomaliesPanel({
  tabs,
  activeTab,
  columns,
  rows,
  isLoading,
  error,
  editingRowId,
  rowDraft,
  newRowDraft,
  onTabChange,
  onEditStart,
  onEditCancel,
  onRowDraftChange,
  onSaveRow,
  onDeleteRow,
  onNewRowFieldChange,
  onCreateRow,
  page,
  pageSize,
  totalRows,
  onPageChange,
}: AnomaliesPanelProps) {
  const writableColumns = columns.filter((column) => column !== 'id')
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))

  return (
    <article className="panel">
      <div className="panel-head">
        <h2>Infos ressources</h2>
        <small>{rows.length} lignes</small>
      </div>

      <div className="metric-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={tab === activeTab ? 'active' : ''}
            onClick={() => onTabChange(tab)}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {error ? <p>{error}</p> : null}

      <div className="cleaning-table-wrap">
        <table className="cleaning-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + 1}>Chargement des donnees...</td>
              </tr>
            ) : null}

            {!isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1}>Aucune donnee pour cet onglet.</td>
              </tr>
            ) : null}

            {!isLoading
              ? rows.map((row, index) => {
                  const rowId = Number(row.id)
                  const key = Number.isFinite(rowId) ? rowId : index
                  const isEditing = Number.isFinite(rowId) && editingRowId === rowId
                  const canMutateRow = Number.isFinite(rowId)

                  return (
                    <tr key={key}>
                      {columns.map((column) => (
                        <td key={`${key}-${column}`}>
                          {isEditing && column !== 'id' ? (
                            <input
                              value={rowDraft[column] ?? ''}
                              onChange={(event) => onRowDraftChange(column, event.target.value)}
                            />
                          ) : (
                            String(row[column] ?? '')
                          )}
                        </td>
                      ))}
                      <td>
                        {isEditing ? (
                          <>
                            <button type="button" onClick={() => void onSaveRow()}>
                              Valider
                            </button>
                            <button type="button" onClick={onEditCancel}>
                              Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => onEditStart(row)} disabled={!canMutateRow}>
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => void onDeleteRow(rowId)}
                              disabled={!canMutateRow}
                            >
                              Supprimer
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })
              : null}

            {!isLoading ? (
              <tr className="new-row">
                {columns.map((column) => (
                  <td key={`new-${column}`}>
                    {column === 'id' ? (
                      <span>-</span>
                    ) : (
                      // Keep inputs controlled so the footer row can post directly to the active endpoint.
                      <input
                        value={newRowDraft[column] ?? ''}
                        onChange={(event) => onNewRowFieldChange(column, event.target.value)}
                      />
                    )}
                  </td>
                ))}
                <td>
                  <button type="button" onClick={() => void onCreateRow()} disabled={writableColumns.length === 0}>
                    Ajouter
                  </button>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="pagination-controls" >
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          Précédent
        </button>
        <span>
          Page {page} / {totalPages}
        </span>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Suivant
        </button>
        <span>|</span>
        <label>
          Taille&nbsp;
        </label>
        <span>| {totalRows} lignes</span>
      </div>
    </article>
  )
}

export default AnomaliesPanel
