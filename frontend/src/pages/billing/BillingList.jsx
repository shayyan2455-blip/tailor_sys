import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { orderApi } from '../../api/orderApi';
import { paymentApi } from '../../api/paymentApi';
import DataTable from '../../components/shared/DataTable.jsx';
import PaymentModal from '../../components/billing/PaymentModal.jsx';
import OrderTrackingModal from '../../components/billing/OrderTrackingModal.jsx';
import StatusBadge from '../../components/production/StatusBadge.jsx';
import { formatDate } from '../../utils/dateFormat';

export default function BillingList() {
  const [rows, setRows] = useState([]);
  const [paying, setPaying] = useState(null);
  const [tracking, setTracking] = useState(null);

  async function load() {
    const response = await orderApi.list();
    setRows(response.data.data);
  }

  useEffect(() => { load(); }, []);

  async function savePayment(payload) {
    await paymentApi.create(payload);
    await load();
  }

  return (
    <div>
      <div className="page-toolbar d-flex align-items-center justify-content-between mb-2">
        <h1 className="h5 mb-0">Orders</h1>
        <button className="btn btn-sm btn-outline-secondary icon-btn" type="button" onClick={load} title="Refresh"><i className="bi bi-arrow-clockwise" /></button>
      </div>
      <DataTable searchable columns={[
        { key: 'id', label: 'Order' },
        { key: 'customer_name', label: 'Customer' },
        { key: 'total_amount', label: 'Total' },
        { key: 'advance', label: 'Advance' },
        { key: 'balance', label: 'Balance' },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> }
      ]} rows={rows} actions={(row) => (
        <div className="btn-group btn-group-sm">
          <Link className="btn btn-outline-secondary" to={`/orders/${row.id}`} title="View"><i className="bi bi-eye" /></Link>
          <button className="btn btn-outline-info" type="button" onClick={() => setTracking(row)} title="Track"><i className="bi bi-geo-alt" /></button>
          <button className="btn btn-outline-primary" type="button" onClick={() => setPaying(row)} title="Payment"><i className="bi bi-cash" /></button>
        </div>
      )} />
      <PaymentModal show={Boolean(paying)} order={paying} onClose={() => setPaying(null)} onSave={savePayment} />
      <OrderTrackingModal show={Boolean(tracking)} order={tracking} onClose={() => setTracking(null)} />
    </div>
  );
}
