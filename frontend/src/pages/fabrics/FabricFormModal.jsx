import { useEffect, useState } from 'react';
import FormModal from '../../components/shared/FormModal.jsx';

const initial = { name: '', cost_per_unit: '', supplier: '', is_active: true };

export default function FabricFormModal({ show, record, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm(record ? {
      name: record.name || '',
      cost_per_unit: record.cost_per_unit || 0,
      supplier: record.supplier || '',
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
      setError(err.error?.message || 'Unable to save fabric');
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormModal show={show} title={record ? 'Edit Fabric' : 'New Fabric'} onSubmit={submit} onClose={onClose} busy={busy} error={error}>
      <div className="row g-2">
        <div className="col-md-5">
          <label className="form-label small">Name</label>
          <input className="form-control form-control-sm" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </div>
        <div className="col-md-3">
          <label className="form-label small">Cost / Unit</label>
          <input className="form-control form-control-sm" type="number" min="0" step="0.01" value={form.cost_per_unit} onChange={(event) => setForm({ ...form, cost_per_unit: Number(event.target.value) })} />
        </div>
        <div className="col-md-4">
          <label className="form-label small">Supplier</label>
          <input className="form-control form-control-sm" value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })} />
        </div>
        <div className="col-12">
          <div className="form-check">
            <input className="form-check-input" type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} id="fabricActive" />
            <label className="form-check-label small" htmlFor="fabricActive">Active</label>
          </div>
        </div>
      </div>
    </FormModal>
  );
}
