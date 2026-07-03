import { useEffect, useState } from 'react';
import FormModal from '../../components/shared/FormModal.jsx';

const initial = { name: '', description: '', default_rate: '', is_active: true };

export default function DesignFormModal({ show, record, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm(record ? {
      name: record.name || '',
      description: record.description || '',
      default_rate: record.default_rate || 0,
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
      setError(err.error?.message || 'Unable to save design');
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormModal show={show} title={record ? 'Edit Design' : 'New Design'} onSubmit={submit} onClose={onClose} busy={busy} error={error}>
      <div className="row g-2">
        <div className="col-md-7">
          <label className="form-label small">Name</label>
          <input className="form-control form-control-sm" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </div>
        <div className="col-md-5">
          <label className="form-label small">Default Rate</label>
          <input className="form-control form-control-sm" type="number" min="0" step="0.01" value={form.default_rate} onChange={(event) => setForm({ ...form, default_rate: Number(event.target.value) })} />
        </div>
        <div className="col-12">
          <label className="form-label small">Description</label>
          <textarea className="form-control form-control-sm" rows="2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </div>
        <div className="col-12">
          <div className="form-check">
            <input className="form-check-input" type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} id="designActive" />
            <label className="form-check-label small" htmlFor="designActive">Active</label>
          </div>
        </div>
      </div>
    </FormModal>
  );
}
