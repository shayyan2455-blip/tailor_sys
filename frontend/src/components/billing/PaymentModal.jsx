import { useEffect, useState } from 'react';
import FormModal from '../shared/FormModal.jsx';

const initial = {
  amount: 0,
  payment_date: new Date().toISOString().slice(0, 10),
  payment_type: 'Partial',
  reference: '',
  notes: ''
};

export default function PaymentModal({ show, order, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm({ ...initial, amount: order?.balance || 0, payment_type: Number(order?.balance || 0) > 0 ? 'Final' : 'Partial' });
    setError('');
  }, [order, show]);

  async function submit(event) {
    event.preventDefault();
    if (Number(form.amount) <= 0) {
      setError('Amount must be greater than zero');
      return;
    }
    setBusy(true);
    try {
      await onSave({ ...form, order_id: order.id });
      onClose();
    } catch (err) {
      setError(err.error?.message || 'Unable to record payment');
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormModal show={show} title={`Payment for Order #${order?.id || ''}`} onSubmit={submit} onClose={onClose} busy={busy} error={error} submitLabel="Record Payment">
      <div className="row g-2">
        <div className="col-md-3">
          <label className="form-label small">Amount</label>
          <input className="form-control form-control-sm" type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} required />
        </div>
        <div className="col-md-3">
          <label className="form-label small">Date</label>
          <input className="form-control form-control-sm" type="date" value={form.payment_date} onChange={(event) => setForm({ ...form, payment_date: event.target.value })} required />
        </div>
        <div className="col-md-3">
          <label className="form-label small">Type</label>
          <select className="form-select form-select-sm" value={form.payment_type} onChange={(event) => setForm({ ...form, payment_type: event.target.value })}>
            <option>Advance</option>
            <option>Partial</option>
            <option>Final</option>
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label small">Reference</label>
          <input className="form-control form-control-sm" value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} />
        </div>
        <div className="col-12">
          <label className="form-label small">Notes</label>
          <textarea className="form-control form-control-sm" rows="2" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        </div>
      </div>
    </FormModal>
  );
}
