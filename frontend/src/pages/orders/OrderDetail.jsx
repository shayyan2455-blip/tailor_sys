import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '../../api/orderApi';
import DataTable from '../../components/shared/DataTable.jsx';
import StatusBadge from '../../components/production/StatusBadge.jsx';
import { formatDate } from '../../utils/dateFormat';

const measurementLabels = {
  neck: 'Neck',
  chest: 'Chest',
  waist: 'Waist',
  hip: 'Hip',
  shoulder: 'Shoulder',
  sleeve: 'Sleeve',
  length: 'Length',
  collar: 'Collar',
  shalwar_len: 'Shalwar Length',
  pancha: 'Pancha'
};

const measurementFields = Object.keys(measurementLabels);

export default function OrderDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    orderApi.detail(id).then((response) => setDetail(response.data.data));
  }, [id]);

  function printReceipt() {
    window.print();
  }

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
        <button className="btn btn-sm btn-primary" type="button" onClick={printReceipt} title="Print Receipt">
          <i className="bi bi-printer me-1" /> Print Receipt
        </button>
      </div>
      <div className="bg-white border rounded-2 p-2 mb-2">
        <div className="order-summary-grid small">
          <div className="order-summary-field">
            <strong>Customer:</strong>
            <span>{order.customer_name}</span>
          </div>
          <div className="order-summary-field">
            <strong>Mobile:</strong>
            <span>{order.mobile}</span>
          </div>
          <div className="order-summary-field">
            <strong>Address:</strong>
            <span>{order.address || '-'}</span>
          </div>
          <div className="order-summary-field">
            <strong>Total:</strong>
            <span>{Number(order.total_amount).toLocaleString()}</span>
          </div>
          <div className="order-summary-field">
            <strong>Advance:</strong>
            <span>{Number(order.advance).toLocaleString()}</span>
          </div>
          <div className="order-summary-field">
            <strong>Balance:</strong>
            <span>{Number(order.balance).toLocaleString()}</span>
          </div>
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
            {measurements ? (
              <div className="measurement-detail-list">
                {measurementFields.map((field) => (
                  <div className="measurement-detail-row" key={field}>
                    <strong>{measurementLabels[field]}:</strong>
                    <span>{measurements[field] ?? '-'}</span>
                  </div>
                ))}
              </div>
            ) : 'No measurements'}
          </div>
        </div>
        <div className="col-lg-6">
          <DataTable columns={[
            { key: 'payment_date', label: 'Date', render: (row) => formatDate(row.payment_date) },
            { key: 'payment_type', label: 'Type' },
            { key: 'amount', label: 'Amount' }
          ]} rows={payments} pageSize={5} />
        </div>
      </div>
    </div>
  );
}
