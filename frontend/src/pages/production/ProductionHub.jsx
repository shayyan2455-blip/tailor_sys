import { useEffect, useState } from 'react';
import { productionApi } from '../../api/productionApi';
import { workerApi } from '../../api/workerApi';
import { assignmentApi } from '../../api/assignmentApi';
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
  const [workerPrompt, setWorkerPrompt] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const { user } = useAuth();

  async function load() {
    try {
      const response = await productionApi.active();
      setRows(response.data.data);
    } catch (err) {
      console.error('Error loading production data:', err);
    }
  }

  async function loadWorkers(stage) {
    try {
      const response = await workerApi.list();
      const filteredWorkers = response.data.data.filter(w => w.default_stage === stage && w.is_active);
      setWorkers(filteredWorkers);
    } catch (err) {
      console.error('Error loading workers:', err);
    }
  }

  useEffect(() => { load(); }, []);

  function toggle(order, stage) {
    const isCompleted = order.completed_stages?.includes(stage);
    const isCurrent = order.current_stage === stage;
    
    if (isCompleted) {
      return; // already completed, do nothing
    }
    
    if (stage === 'Ready') {
      // Ready stage - move and complete instantly without worker or amount
      moveToAndCompleteStage(order, stage);
      return;
    }
    
    if (isCurrent) {
      // Current stage - prompt for amount to complete
      setAmountPrompt({ order, stage });
      setAmount(0);
    } else {
      // Move to this stage - prompt for worker selection
      setWorkerPrompt({ order, stage });
      setSelectedWorker(null);
      loadWorkers(stage);
    }
  }

  async function moveToStage(order, stage) {
    setBusy(`${order.id}-${stage}`);
    try {
      await productionApi.toggleStage({ order_id: order.id, stage });
      setWorkerPrompt(null);
      setSelectedWorker(null);
      setWorkers([]);
      await load();
    } catch (err) {
      console.error('Error moving to stage:', err);
      const errorMessage = err?.response?.data?.error?.message || err?.error?.message || err?.message || 'Failed to move to stage';
      alert(errorMessage);
    } finally {
      setBusy('');
    }
  }

  async function moveToAndCompleteStage(order, stage) {
    setBusy(`${order.id}-${stage}`);
    try {
      await productionApi.toggleStage({ order_id: order.id, stage, completed: true, amount: 0 });
      await load();
    } catch (err) {
      console.error('Error moving and completing stage:', err);
      const errorMessage = err?.response?.data?.error?.message || err?.error?.message || err?.message || 'Failed to complete stage';
      alert(errorMessage);
    } finally {
      setBusy('');
    }
  }

  async function moveToStageWithWorker(order, stage, workerId) {
    setBusy(`${order.id}-${stage}`);
    try {
      // First move to the stage
      await productionApi.toggleStage({ order_id: order.id, stage });
      // Then assign the worker
      await assignmentApi.create({ order_id: order.id, worker_id: workerId, stage });
      setWorkerPrompt(null);
      setSelectedWorker(null);
      await load();
    } catch (err) {
      console.error('Error moving to stage with worker:', err);
      const errorMessage = err?.response?.data?.error?.message || err?.error?.message || err?.message || 'Failed to assign worker';
      alert(errorMessage);
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
      <FormModal 
        show={Boolean(workerPrompt)} 
        title={`Assign Worker for ${workerPrompt?.stage} Stage`} 
        onSubmit={() => selectedWorker && moveToStageWithWorker(workerPrompt?.order, workerPrompt?.stage, selectedWorker)} 
        onClose={() => { setWorkerPrompt(null); setSelectedWorker(null); setWorkers([]); }} 
        busy={busy !== ''}
      >
        <div className="mb-3">
          <label className="form-label small">Select a worker (default stage: {workerPrompt?.stage})</label>
          {workers.length === 0 ? (
            <p className="text-muted small">No workers with default stage "{workerPrompt?.stage}" found. Use the assign button to assign any worker.</p>
          ) : (
            <select 
              className="form-select form-select-sm" 
              value={selectedWorker || ''} 
              onChange={(e) => setSelectedWorker(Number(e.target.value))}
              autoFocus
            >
              <option value="">Select a worker...</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>{worker.name}</option>
              ))}
            </select>
          )}
        </div>
        <div className="d-flex gap-2">
          <button 
            type="button" 
            className="btn btn-sm btn-danger" 
            onClick={() => moveToStage(workerPrompt?.order, workerPrompt?.stage)}
          >
            Move Without Default Worker
          </button>
        </div>
      </FormModal>
    </div>
  );
}
