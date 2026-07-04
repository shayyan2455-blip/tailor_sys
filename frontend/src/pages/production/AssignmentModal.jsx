import { useState, useEffect } from 'react';
import FormModal from '../../components/shared/FormModal.jsx';
import { assignmentApi } from '../../api/assignmentApi';
import { workerApi } from '../../api/workerApi';

const stages = ['Booked', 'Cutting', 'Stitching', 'Ready', 'Delivered'];

export default function AssignmentModal({ show, order, onClose }) {
  const [form, setForm] = useState({ worker_id: '', stage: 'Cutting' });
  const [workers, setWorkers] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (show) {
      workerApi.list().then((response) => {
        setWorkers(response.data.data.filter(w => w.is_active));
      }).catch((err) => {
        console.error('Error loading workers:', err);
      });
    }
  }, [show]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!form.worker_id) {
      setError('Please select a worker');
      return;
    }
    setBusy(true);
    try {
      await assignmentApi.create({
        order_id: order.id,
        worker_id: Number(form.worker_id),
        stage: form.stage
      });
      setForm({ worker_id: '', stage: 'Cutting' });
      onClose();
    } catch (err) {
      setError(err.error?.message || 'Unable to create assignment');
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormModal show={show} title={order ? `Assign Worker for Order #${order.id}` : 'Assign Worker'} onSubmit={submit} onClose={onClose} busy={busy} error={error}>
      <div className="row g-2">
        <div className="col-md-6">
          <label className="form-label small">Worker</label>
          <select 
            className="form-select form-select-sm" 
            value={form.worker_id} 
            onChange={(event) => setForm({ ...form, worker_id: event.target.value })}
            required
          >
            <option value="">Select worker</option>
            {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label small">Stage</label>
          <select 
            className="form-select form-select-sm" 
            value={form.stage} 
            onChange={(event) => setForm({ ...form, stage: event.target.value })}
            required
          >
            {stages.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
    </FormModal>
  );
}
