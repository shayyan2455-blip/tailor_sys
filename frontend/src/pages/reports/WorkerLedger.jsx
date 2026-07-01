import { useEffect, useState } from 'react';
import { reportApi } from '../../api/reportApi';
import { useMasterData } from '../../context/MasterDataContext.jsx';
import DataTable from '../../components/shared/DataTable.jsx';
import ReportFilters from './ReportFilters.jsx';
import { formatDate } from '../../utils/dateFormat';

export default function WorkerLedger() {
  const master = useMasterData();
  const [filters, setFilters] = useState({});
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  async function load() {
    try {
      setError('');
      setRows((await reportApi.workerLedger(filters)).data.data);
    } catch (err) {
      console.error('Error loading worker ledger:', err);
      setError(err.error?.message || 'Failed to load report');
    }
  }

  useEffect(() => {
    master.load('workers');
    load();
  }, []);

  return (
    <div>
      <div className="page-toolbar d-flex align-items-center mb-2"><h1 className="h5 mb-0">Worker Ledger</h1></div>
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
      <ReportFilters filters={filters} onChange={setFilters} onRun={load}>
        <div className="col-md-3">
          <label className="form-label small">Worker</label>
          <select className="form-select form-select-sm" value={filters.worker_id || ''} onChange={(event) => setFilters({ ...filters, worker_id: event.target.value })}>
            <option value="">All workers</option>
            {master.workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}
          </select>
        </div>
      </ReportFilters>
      {error && <div className="alert alert-danger py-2 mb-2">{error}</div>}
      <DataTable searchable search={search} columns={[
        { key: 'worker_name', label: 'Worker' },
        { key: 'total_earnings', label: 'Total Earned' },
        { key: 'total_paid', label: 'Total Paid' },
        { key: 'balance', label: 'Balance' }
      ]} rows={rows} keyField="worker_name" />
    </div>
  );
}
