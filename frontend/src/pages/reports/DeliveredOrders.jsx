import { useEffect, useState } from 'react';
import { reportApi } from '../../api/reportApi';
import DataTable from '../../components/shared/DataTable.jsx';
import ReportFilters from './ReportFilters.jsx';
import { formatDate } from '../../utils/dateFormat';

export default function DeliveredOrders() {
  const [filters, setFilters] = useState({});
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  async function load() { setRows((await reportApi.deliveredOrders(filters)).data.data); }
  useEffect(() => { load(); }, []);
  return (
    <div>
      <div className="page-toolbar d-flex align-items-center mb-2"><h1 className="h5 mb-0">Delivered Orders</h1></div>
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
      <DataTable searchable search={search} columns={[
        { key: 'id', label: 'Order' },
        { key: 'customer_name', label: 'Customer' },
        { key: 'order_date', label: 'Order Date', render: (row) => formatDate(row.order_date) },
        { key: 'total_amount', label: 'Total' },
        { key: 'balance', label: 'Balance' }
      ]} rows={rows} />
    </div>
  );
}
