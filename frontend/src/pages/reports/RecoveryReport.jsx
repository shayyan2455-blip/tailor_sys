import { useEffect, useState } from 'react';
import { reportApi } from '../../api/reportApi';
import DataTable from '../../components/shared/DataTable.jsx';
import ReportFilters from './ReportFilters.jsx';
import { formatDate } from '../../utils/dateFormat';

export default function RecoveryReport() {
  const [filters, setFilters] = useState({});
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  async function load() {
    try {
      setError('');
      setRows((await reportApi.recovery(filters)).data.data);
    } catch (err) {
      console.error('Error loading recovery report:', err);
      setError(err.error?.message || 'Failed to load report');
    }
  }
  useEffect(() => { load(); }, []);
  return (
    <div>
      <div className="page-toolbar d-flex align-items-center justify-content-between mb-2">
        <h1 className="h5 mb-0">Recovery Report</h1>
        <strong>Outstanding: {rows.reduce((sum, row) => sum + Number(row.balance || 0), 0).toLocaleString()}</strong>
      </div>
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
      {error && <div className="alert alert-danger py-2 mb-2">{error}</div>}
      <DataTable searchable search={search} columns={[
        { key: 'id', label: 'Order' },
        { key: 'customer_name', label: 'Customer' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'total_amount', label: 'Total' },
        { key: 'advance', label: 'Advance' },
        { key: 'balance', label: 'Balance' }
      ]} rows={rows} />
    </div>
  );
}
