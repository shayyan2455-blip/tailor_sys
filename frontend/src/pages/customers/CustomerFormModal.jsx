import { useEffect, useState } from 'react';
import FormModal from '../../components/shared/FormModal.jsx';

const initial = { name: '', mobile: '', address: '' };

export default function CustomerFormModal({ show, record, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm(record ? { name: record.name || '', mobile: record.mobile || '', address: record.address || '' } : initial);
    setError('');
  }, [record, show]);

  async function submit(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.mobile.trim()) {
      setError('Name and mobile are required');
      return;
    }
    setBusy(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.error?.message || 'Unable to save customer');
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormModal show={show} title={record ? 'Edit Customer' : 'New Customer'} onSubmit={submit} onClose={onClose} busy={busy} error={error}>
      <div className="row g-2">
        <div className="col-md-6">
          <label className="form-label small">Name</label>
          <input className="form-control form-control-sm" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </div>
        <div className="col-md-6">
          <label className="form-label small">Mobile</label>
          <input className="form-control form-control-sm" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} required />
        </div>
        <div className="col-12">
          <label className="form-label small">Address</label>
          <textarea className="form-control form-control-sm" rows="2" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
        </div>
      </div>
    </FormModal>
  );
}
