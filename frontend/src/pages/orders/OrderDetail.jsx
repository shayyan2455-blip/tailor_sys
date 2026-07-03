import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '../../api/orderApi';
import DataTable from '../../components/shared/DataTable.jsx';
import StatusBadge from '../../components/production/StatusBadge.jsx';
import InvoiceSlip from '../../components/invoice/InvoiceSlip.jsx';
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
      <InvoiceSlip order={order} items={items} payments={payments} measurements={measurements} />
      <div className="row g-2 mt-2">
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
