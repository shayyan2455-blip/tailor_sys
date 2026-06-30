import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '../../api/orderApi';
import DataTable from '../../components/shared/DataTable.jsx';
import StatusBadge from '../../components/production/StatusBadge.jsx';

export default function OrderDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    orderApi.detail(id).then((response) => setDetail(response.data));
  }, [id]);

  if (!detail) return <div className="p-3 small text-muted">Loading order...</div>;
  const { order, items, measurements, payments } = detail;

  return (
    <div>
      <div className="page-toolbar d-flex align-items-center justify-content-between mb-2">
        <div className="d-flex align-items-center gap-2">
          <Link to="/billing" className="btn btn-sm btn-outline-secondary icon-btn" title="Back"><i className="bi bi-arrow-left" /></Link>
          <h1 className="h5 mb-0">Order #{order.id}</h1>
          <StatusBadge value={order.current_stage} />
        </div>
      </div>
      <div className="bg-white border rounded-2 p-2 mb-2">
        <div className="row g-2 small">
          <div className="col-md-3"><strong>Customer:</strong> {order.customer_name}</div>
          <div className="col-md-2"><strong>Mobile:</strong> {order.mobile}</div>
          <div className="col-md-2"><strong>Total:</strong> {Number(order.total_amount).toLocaleString()}</div>
          <div className="col-md-2"><strong>Advance:</strong> {Number(order.advance).toLocaleString()}</div>
          <div className="col-md-2"><strong>Balance:</strong> {Number(order.balance).toLocaleString()}</div>
        </div>
      </div>
      <DataTable columns={[
        { key: 'garment_type', label: 'Garment' },
        { key: 'qty', label: 'Qty' },
        { key: 'rate', label: 'Rate' },
        { key: 'fabric_name', label: 'Fabric' },
        { key: 'amount', label: 'Amount' }
      ]} rows={items} />
      <div className="row g-2 mt-1">
        <div className="col-lg-6">
          <div className="bg-white border rounded-2 p-2 small">
            <h2 className="h6">Measurements</h2>
            {measurements ? Object.entries(measurements).filter(([key]) => !['id', 'order_id'].includes(key)).map(([key, value]) => <span className="me-3" key={key}><strong>{key}:</strong> {value ?? '-'}</span>) : 'No measurements'}
          </div>
        </div>
        <div className="col-lg-6">
          <DataTable columns={[
            { key: 'payment_date', label: 'Date' },
            { key: 'payment_type', label: 'Type' },
            { key: 'amount', label: 'Amount' }
          ]} rows={payments} pageSize={5} />
        </div>
      </div>
    </div>
  );
}
