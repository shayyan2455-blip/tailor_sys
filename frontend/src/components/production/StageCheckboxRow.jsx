const stages = ['Booked', 'Cutting', 'Stitching', 'Ready', 'Delivered'];

export default function StageCheckboxRow({ order, onToggle, busyStage, isWorker = false, completedStages = [] }) {
  return (
    <div className="d-flex flex-wrap gap-2">
      {stages.map((stage) => {
        const isAssigned = order.assigned_stage === stage;
        const isCurrent = order.current_stage === stage;
        const isCompleted = completedStages.includes(stage);
        const canToggle = !isWorker || isAssigned;
        
        return (
          <button
            key={stage}
            className={`btn btn-sm ${
              isCompleted ? 'btn-success' : 
              isCurrent ? 'btn-primary' : 
              isAssigned ? 'btn-outline-primary' : 
              'btn-outline-secondary'
            }`}
            type="button"
            disabled={busyStage === stage || !canToggle}
            onClick={() => onToggle(order, stage)}
            title={isWorker && isAssigned ? `Complete ${stage}` : `Mark ${stage}`}
          >
            {isCompleted && <i className="bi bi-check2-circle me-1" />}
            {stage}
          </button>
        );
      })}
    </div>
  );
}
