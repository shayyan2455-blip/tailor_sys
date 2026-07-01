import { useEffect, useState } from 'react';
import { reportApi } from '../../api/reportApi';
import DataTable from '../../components/shared/DataTable.jsx';
import ReportFilters from './ReportFilters.jsx';
import { formatDate } from '../../utils/dateFormat';

export default function PendingOrders() {
  const [filters, setFilters] = useState({});
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  async function load() { setRows((await reportApi.pendingOrders(filters)).data.data); }
  useEffect(() => { load(); }, []);
  return <ReportPage title="Pending Orders" filters={filters} setFilters={setFilters} load={load} rows={rows} search={search} setSearch={setSearch} />;
}

function ReportPage({ title, filters, setFilters, load, rows, search, setSearch }) {
  return (
    <div>
      <div className="page-toolbar d-flex align-items-center mb-2"><h1 className="h5 mb-0">{title}</h1></div>
      <div className="bg-white border rounded-2 p-2 mb-2">
        <div className="input-group input-group-sm">
          <span className="input-group-text"><i className="bi bi-search" /></span>
          <input
            className="form-control"
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="btn btn-outline-secondary" type="button" onClick={() => setSearch('')}>
              <i className="bi bi-x-lg" />
            </button>
          )}
        </div>
      </div>
      <ReportFilters filters={filters} onChange={setFilters} onRun={load} />
      <DataTable searchable externalSearch columns={[
        { key: 'id', label: 'Order' },
        { key: 'customer_name', label: 'Customer' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'delivery_date', label: 'Delivery', render: (row) => formatDate(row.delivery_date) },
        { key: 'current_stage', label: 'Stage' },
        { key: 'balance', label: 'Balance' }
      ]} rows={rows} />
    </div>
  );
}
