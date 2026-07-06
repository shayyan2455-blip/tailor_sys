import { useEffect, useState } from 'react';
import { reportApi } from '../../api/reportApi';
import DataTable from '../../components/shared/DataTable.jsx';
import ReportFilters from './ReportFilters.jsx';
import { formatDate } from '../../utils/dateFormat';

export default function DeliveredOrders() {
  const [filters, setFilters] = useState({});
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ nextCursor: null, hasMore: false });
  const [loading, setLoading] = useState(false);
  
  async function load(cursor = null) {
    setLoading(true);
    try {
      const response = await reportApi.deliveredOrders({ ...filters, cursor, limit: 50 });
      setRows(response.data.data);
      setPagination(response.data.pagination || { nextCursor: null, hasMore: false });
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => { load(); }, []);
  
  const handleLoadMore = () => {
    if (pagination.nextCursor && !loading) {
      load(pagination.nextCursor);
    }
  };
  
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
      <ReportFilters filters={filters} onChange={setFilters} onRun={() => load()} />
      <DataTable searchable search={search} columns={[
        { key: 'id', label: 'Order' },
        { key: 'customer_name', label: 'Customer' },
        { key: 'order_date', label: 'Order Date', render: (row) => formatDate(row.order_date) },
        { key: 'current_stage', label: 'Stage' },
        { key: 'assigned_stage', label: 'Assigned' },
        { key: 'worker_name', label: 'Worker' },
        { key: 'total_amount', label: 'Total' },
        { key: 'balance', label: 'Balance' }
      ]} rows={rows} />
      {pagination.hasMore && (
        <div className="text-center mt-3">
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
