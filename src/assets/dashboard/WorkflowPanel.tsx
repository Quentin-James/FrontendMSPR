import type { WorkflowStatus } from '../../types/dashboard'

interface WorkflowPanelProps {
  workflowStatus: WorkflowStatus
  workflowProgress: number
  onWorkflowChange: (status: WorkflowStatus) => void
}

function WorkflowPanel({ workflowStatus, workflowProgress, onWorkflowChange }: WorkflowPanelProps) {
  return (
    <section className="workflow">
      <div>
        <h2>Workflow de validation</h2>
        <p>
          Statut courant: <strong>{workflowStatus}</strong>
        </p>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={workflowProgress}
        >
          <div className="progress-fill" style={{ width: `${workflowProgress}%` }} />
        </div>
      </div>
      <div className="workflow-actions">
        <button type="button" onClick={() => onWorkflowChange('draft')}>
          Brouillon
        </button>
        <button type="button" onClick={() => onWorkflowChange('in_review')}>
          Mettre en revue
        </button>
        <button type="button" onClick={() => onWorkflowChange('approved')}>
          Approuver
        </button>
      </div>
    </section>
  )
}

export default WorkflowPanel

