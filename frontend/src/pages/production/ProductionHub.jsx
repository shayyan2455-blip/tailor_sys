import { useEffect, useState } from 'react';
import { productionApi } from '../../api/productionApi';
import DataTable from '../../components/shared/DataTable.jsx';
import StageCheckboxRow from '../../components/production/StageCheckboxRow.jsx';
import StatusBadge from '../../components/production/StatusBadge.jsx';
import AssignmentModal from './AssignmentModal.jsx';
import FormModal from '../../components/shared/FormModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDate } from '../../utils/dateFormat';

export default function ProductionHub() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState('');
  const [assigning, setAssigning] = useState(null);
  const [amountPrompt, setAmountPrompt] = useState(null);
  const [amount, setAmount] = useState(0);
  const { user } = useAuth();

  async function load() {
    try {
      const response = await productionApi.active();
      setRows(response.data.data);
    } catch (err) {
      console.error('Error loading production data:', err);
    }
  }

  useEffect(() => { load(); }, []);

  function toggle(order, stage) {
    const isCompleted = order.completed_stages?.includes(stage);
    const isCurrent = order.current_stage === stage;
    
    if (isCompleted) {
      return; //_already completed, do nothing
    }
    
    if (isCurrent) {
      // Current stage - prompt for amount to complete
      setAmountPrompt({ order, stage });
      setAmount(0);
    } else {
      // Move to this stage
      moveToStage(order, stage);
    }
  }

  async function moveToStage(order, stage) {
    setBusy(`${order.id}-${stage}`);
    try {
      await productionApi.toggleStage({ order_id: order.id, stage });
      await load();
    } finally {
      setBusy('');
    }
  }

  async function completeStage(order, stage, amountValue) {
    setBusy(`${order.id}-${stage}`);
    try {
      await productionApi.toggleStage({ order_id: order.id, stage, completed: true, amount: amountValue });
      setAmountPrompt(null);
      setAmount(0);
      await load();
    } catch (err) {
      console.error('Error completing stage:', err);
      const errorMessage = err?.response?.data?.error?.message || err?.error?.message || err?.message || 'Failed to complete stage';
      alert(errorMessage);
    } finally {
      setBusy('');
    }
  }

  return (
    <div>
      <div className="page-toolbar d-flex align-items-center justify-content-between mb-2">
        <h1 className="h5 mb-0">Production Hub</h1>
        <button className="btn btn-sm btn-outline-secondary icon-btn" type="button" onClick={load} title="Refresh"><i className="bi bi-arrow-clockwise" /></button>
      </div>
      <DataTable searchable columns={[
        { key: 'id', label: 'Order' },
        { key: 'customer_name', label: 'Customer' },
        { key: 'delivery_date', label: 'Delivery', render: (row) => formatDate(row.delivery_date) },
        { key: 'current_stage', label: 'Stage', render: (row) => <StatusBadge value={row.current_stage} /> },
        { key: 'assigned_stage', label: 'Assigned' },
        { key: 'worker_name', label: 'Worker' },
        { key: 'stageActions', label: 'Progress', render: (row) => <StageCheckboxRow order={row} onToggle={toggle} busyStage={busy.startsWith(`${row.id}-`) ? busy.split('-')[1] : ''} isWorker={user?.role === 'Worker'} completedStages={row.completed_stages || []} /> }
      ]} rows={rows} actions={(row) => (
        user?.role !== 'Worker' && (
          <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => setAssigning(row)} title="Assign Worker">
            <i className="bi bi-person-plus" />
          </button>
        )
      )} />
      <AssignmentModal show={Boolean(assigning)} order={assigning} onClose={() => setAssigning(null)} />
      <FormModal 
        show={Boolean(amountPrompt)} 
        title={`Complete ${amountPrompt?.stage} Stage`} 
        onSubmit={() => completeStage(amountPrompt?.order, amountPrompt?.stage, amount)} 
        onClose={() => { setAmountPrompt(null); setAmount(0); }} 
        busy={busy !== ''}
      >
        <div className="mb-3">
          <label className="form-label small">Amount for this stage completion</label>
          <input 
            className="form-control form-control-sm" 
            type="number" 
            min="0" 
            step="0.01" 
            value={amount} 
            onChange={(e) => setAmount(Number(e.target.value))} 
            autoFocus 
          />
        </div>
      </FormModal>
    </div>
  );
}
