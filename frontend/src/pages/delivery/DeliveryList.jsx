import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { orderApi } from '../../api/orderApi';
import { productionApi } from '../../api/productionApi';
import DataTable from '../../components/shared/DataTable.jsx';
import StatusBadge from '../../components/production/StatusBadge.jsx';
import { formatDate } from '../../utils/dateFormat';

export default function DeliveryList() {
  const [rows, setRows] = useState([]);

  async function load() {
    const response = await orderApi.deliveryList();
    setRows(response.data.data);
  }

  useEffect(() => { load(); }, []);

  async function markDelivered(row) {
    if (row.balance > 0) {
      alert('Order cannot be delivered until the remaining balance is paid');
      return;
    }
    await productionApi.toggleStage({ order_id: row.id, stage: 'Delivered', completed: true });
    await load();
  }

  return (
    <div>
      <div className="page-toolbar d-flex align-items-center justify-content-between mb-2">
        <h1 className="h5 mb-0">Delivery</h1>
        <button className="btn btn-sm btn-outline-secondary icon-btn" type="button" onClick={load} title="Refresh"><i className="bi bi-arrow-clockwise" /></button>
      </div>
      <DataTable searchable columns={[
        { key: 'id', label: 'Order' },
        { key: 'customer_name', label: 'Customer' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'address', label: 'Address' },
        { key: 'delivery_date', label: 'Due', render: (row) => formatDate(row.delivery_date) },
        { key: 'total_amount', label: 'Amount' },
        { key: 'advance', label: 'Advance' },
        { key: 'balance', label: 'Balance' },
        { key: 'current_stage', label: 'Stage', render: (row) => <StatusBadge value={row.current_stage} /> }
      ]} rows={rows} actions={(row) => (
        <div className="btn-group btn-group-sm">
          <Link className="btn btn-outline-secondary" to={`/orders/${row.id}`} title="View"><i className="bi bi-eye" /></Link>
          <button className="btn btn-outline-success" type="button" onClick={() => markDelivered(row)} title="Mark delivered"><i className="bi bi-truck" /></button>
        </div>
      )} />
    </div>
  );
}
