import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../../api/orderApi';
import { useMasterData } from '../../context/MasterDataContext.jsx';
import CustomerLookup from '../../components/orders/CustomerLookup.jsx';
import MeasurementForm from '../../components/orders/MeasurementForm.jsx';
import OrderItemsGrid, { emptyItem } from '../../components/orders/OrderItemsGrid.jsx';
import BalanceSummary from '../../components/orders/BalanceSummary.jsx';

export default function OrderBooking() {
  const navigate = useNavigate();
  const master = useMasterData();
  const [form, setForm] = useState({
    customer_id: '',
    order_date: new Date().toISOString().slice(0, 10),
    delivery_date: '',
    notes: '',
    advance: 0,
    items: [{ ...emptyItem }],
    measurements: {}
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    master.load('customers');
    master.load('fabrics');
    master.load('designs');
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!form.customer_id) {
      setError('Customer is required');
      return;
    }
    setBusy(true);
    try {
      const response = await orderApi.create(form);
      navigate(`/orders/${response.data.id}`);
    } catch (err) {
      setError(err.error?.message || 'Unable to create order');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="page-toolbar d-flex align-items-center justify-content-between mb-2">
        <h1 className="h5 mb-0">Order Booking</h1>
        <button className="btn btn-sm btn-primary" type="submit" disabled={busy}><i className="bi bi-save me-1" />Save Order</button>
      </div>
      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      <div className="bg-white border rounded-2 p-2 mb-2">
        <div className="row g-2">
          <div className="col-md-4"><CustomerLookup customers={master.customers} value={form.customer_id} onChange={(customer_id) => setForm({ ...form, customer_id })} /></div>
          <div className="col-md-2"><label className="form-label small">Order Date</label><input className="form-control form-control-sm" type="date" value={form.order_date} onChange={(event) => setForm({ ...form, order_date: event.target.value })} required /></div>
          <div className="col-md-2"><label className="form-label small">Delivery Date</label><input className="form-control form-control-sm" type="date" value={form.delivery_date} onChange={(event) => setForm({ ...form, delivery_date: event.target.value })} /></div>
          <div className="col-md-2"><label className="form-label small">Advance</label><input className="form-control form-control-sm" type="number" min="0" step="0.01" value={form.advance} onChange={(event) => setForm({ ...form, advance: Number(event.target.value) })} /></div>
          <div className="col-md-2"><label className="form-label small">Notes</label><input className="form-control form-control-sm" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>
        </div>
      </div>
      <div className="d-grid gap-2">
        <OrderItemsGrid items={form.items} fabrics={master.fabrics} onChange={(items) => setForm({ ...form, items })} />
        <MeasurementForm value={form.measurements} onChange={(measurements) => setForm({ ...form, measurements })} />
        <BalanceSummary items={form.items} advance={form.advance} />
      </div>
    </form>
  );
}
