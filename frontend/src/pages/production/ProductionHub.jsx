import { useEffect, useState } from 'react';
import { productionApi } from '../../api/productionApi';
import DataTable from '../../components/shared/DataTable.jsx';
import StageCheckboxRow from '../../components/production/StageCheckboxRow.jsx';
import StatusBadge from '../../components/production/StatusBadge.jsx';

export default function ProductionHub() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState('');

  async function load() {
    const response = await productionApi.active();
    setRows(response.data);
  }

  useEffect(() => { load(); }, []);

  async function toggle(order, stage) {
    setBusy(`${order.id}-${stage}`);
    try {
      await productionApi.toggleStage({ order_id: order.id, stage, completed: true });
      await load();
    } finally {
      setBusy('');
    }
  }

  return (
    <div>
      <div className="page-toolbar d-flex align-items-center justify-content-between mb-2">
        <h1 className="h5 mb-0">Production Hub</h1>
        <button className="btn btn-sm btn-outline-secondary icon-btn" type="button" onClick={load} title="Refresh"><i className="bi bi-arrow-clockwise" /></button>
      </div>
      <DataTable columns={[
        { key: 'id', label: 'Order' },
        { key: 'customer_name', label: 'Customer' },
        { key: 'delivery_date', label: 'Delivery' },
        { key: 'current_stage', label: 'Stage', render: (row) => <StatusBadge value={row.current_stage} /> },
        { key: 'assigned_stage', label: 'Assigned' },
        { key: 'worker_name', label: 'Worker' },
        { key: 'stageActions', label: 'Progress', render: (row) => <StageCheckboxRow order={row} onToggle={toggle} busyStage={busy.startsWith(`${row.id}-`) ? busy.split('-')[1] : ''} /> }
      ]} rows={rows} />
    </div>
  );
}
