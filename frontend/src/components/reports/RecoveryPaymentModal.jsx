import { useState } from 'react';
import FormModal from '../shared/FormModal.jsx';

export default function RecoveryPaymentModal({ show, customer, onClose, onPayment }) {
  const [form, setForm] = useState({
    payment_amount: '',
    payment_type: 'Partial'
  });

  const totalBalance = Number(customer?.total_balance || 0);
  const paymentAmount = Number(form.payment_amount || 0);

  function handleSubmit() {
    onPayment({
      customer_id: customer.customer_id,
      payment_amount: paymentAmount,
      payment_type: form.payment_type
    });
  }

  function handleClose() {
    setForm({ payment_amount: '', payment_type: 'Partial' });
    onClose();
  }

  return (
    <FormModal
      show={show}
      title={`Record Payment - ${customer?.customer_name}`}
      onSubmit={handleSubmit}
      onClose={handleClose}
      busy={false}
    >
      <div className="mb-3 p-2 bg-light rounded">
        <div className="d-flex justify-content-between">
          <span>Total Outstanding Balance:</span>
          <strong className="text-danger">{totalBalance.toLocaleString()}</strong>
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label small">Payment Amount</label>
        <input
          className="form-control form-control-sm"
          type="number"
          min="0"
          step="0.01"
          max={totalBalance}
          value={form.payment_amount}
          onChange={(e) => setForm({ ...form, payment_amount: e.target.value })}
          required
          autoFocus
        />
      </div>
      <div className="mb-3">
        <label className="form-label small">Payment Type</label>
        <select
          className="form-select form-select-sm"
          value={form.payment_type}
          onChange={(e) => setForm({ ...form, payment_type: e.target.value })}
        >
          <option value="Partial">Partial</option>
          <option value="Final">Final</option>
        </select>
      </div>
    </FormModal>
  );
}
