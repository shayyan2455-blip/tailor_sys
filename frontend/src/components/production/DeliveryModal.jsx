import { useState } from 'react';
import FormModal from '../shared/FormModal.jsx';

export default function DeliveryModal({ show, order, onClose, onDeliver }) {
  const [form, setForm] = useState({
    pickup_name: '',
    pickup_phone: '',
    payment_amount: ''
  });
  const [showBalanceWarning, setShowBalanceWarning] = useState(false);

  const remainingBalance = Number(order?.balance || 0);
  const paymentAmount = Number(form.payment_amount || 0);
  const balanceAfterPayment = remainingBalance - paymentAmount;
  const hasRemainingBalance = balanceAfterPayment > 0;

  function handleSubmit() {
    if (hasRemainingBalance && !showBalanceWarning) {
      setShowBalanceWarning(true);
      return;
    }
    onDeliver({
      order_id: order.id,
      pickup_name: form.pickup_name,
      pickup_phone: form.pickup_phone,
      payment_amount: paymentAmount
    });
  }

  function handleClose() {
    setForm({ pickup_name: '', pickup_phone: '', payment_amount: '' });
    setShowBalanceWarning(false);
    onClose();
  }

  return (
    <FormModal
      show={show}
      title={showBalanceWarning ? 'Confirm Delivery with Remaining Balance' : 'Complete Delivery'}
      onSubmit={handleSubmit}
      onClose={handleClose}
      busy={false}
    >
      {!showBalanceWarning ? (
        <>
          <div className="mb-3">
            <label className="form-label small">Pickup Person Name</label>
            <input
              className="form-control form-control-sm"
              type="text"
              value={form.pickup_name}
              onChange={(e) => setForm({ ...form, pickup_name: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div className="mb-3">
            <label className="form-label small">Pickup Person Phone</label>
            <input
              className="form-control form-control-sm"
              type="text"
              value={form.pickup_phone}
              onChange={(e) => setForm({ ...form, pickup_phone: e.target.value })}
              required
            />
          </div>
          <div className="mb-3 p-2 bg-light rounded">
            <div className="d-flex justify-content-between">
              <span>Total Amount:</span>
              <strong>{Number(order?.total_amount || 0).toLocaleString()}</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Advance:</span>
              <strong>{Number(order?.advance || 0).toLocaleString()}</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Remaining Balance:</span>
              <strong className="text-danger">{remainingBalance.toLocaleString()}</strong>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label small">Payment Amount</label>
            <input
              className="form-control form-control-sm"
              type="number"
              min="0"
              step="0.01"
              value={form.payment_amount}
              onChange={(e) => setForm({ ...form, payment_amount: e.target.value })}
              required
            />
            {hasRemainingBalance && (
              <div className="text-danger small mt-1">
                Balance after payment: {balanceAfterPayment.toLocaleString()}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="alert alert-warning">
          <p className="mb-2">Customer will have a remaining balance of <strong>{balanceAfterPayment.toLocaleString()}</strong> after this payment.</p>
          <p className="mb-0">Do you want to continue with the delivery?</p>
        </div>
      )}
      <div className="d-flex gap-2 mt-3">
        <button type="button" className="btn btn-sm btn-secondary" onClick={handleClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-sm btn-success">
          Deliver
        </button>
      </div>
    </FormModal>
  );
}
