import { useEffect, useState } from 'react';
import FormModal from '../../components/shared/FormModal.jsx';

const initial = { name: '', mobile: '', default_stage: '', is_active: true };

const stages = ['Booked', 'Cutting', 'Stitching', 'Trial', 'Alteration', 'Pressing', 'Ready', 'Delivered'];

export default function WorkerFormModal({ show, record, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm(record ? { 
      name: record.name || '', 
      mobile: record.mobile || '', 
      default_stage: record.default_stage || '',
      is_active: record.is_active !== false 
    } : initial);
    setError('');
  }, [record, show]);

  async function submit(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    setBusy(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.error?.message || 'Unable to save worker');
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormModal show={show} title={record ? 'Edit Worker' : 'New Worker'} onSubmit={submit} onClose={onClose} busy={busy} error={error}>
      <div className="row g-2">
        <div className="col-md-5">
          <label className="form-label small">Name</label>
          <input className="form-control form-control-sm" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </div>
        <div className="col-md-4">
          <label className="form-label small">Mobile</label>
          <input className="form-control form-control-sm" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label small">Default Stage (Auto-assign for new orders)</label>
          <select className="form-select form-select-sm" value={form.default_stage} onChange={(event) => setForm({ ...form, default_stage: event.target.value })}>
            <option value="">No default stage</option>
            {stages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
          </select>
        </div>
        <div className="col-12">
          <div className="form-check">
            <input className="form-check-input" type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} id="workerActive" />
            <label className="form-check-label small" htmlFor="workerActive">Active</label>
          </div>
        </div>
      </div>
    </FormModal>
  );
}
