const stages = ['Booked', 'Cutting', 'Stitching', 'Trial', 'Alteration', 'Pressing', 'Ready', 'Delivered'];

export default function StageCheckboxRow({ order, onToggle, busyStage }) {
  return (
    <div className="d-flex flex-wrap gap-2">
      {stages.map((stage) => (
        <button
          key={stage}
          className={`btn btn-sm ${order.current_stage === stage || order.assigned_stage === stage ? 'btn-primary' : 'btn-outline-secondary'}`}
          type="button"
          disabled={busyStage === stage}
          onClick={() => onToggle(order, stage)}
          title={`Mark ${stage}`}
        >
          <i className="bi bi-check2 me-1" />
          {stage}
        </button>
      ))}
    </div>
  );
}
