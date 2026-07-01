import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { reportApi } from '../../api/reportApi';
import ReportFilters from './ReportFilters.jsx';
import DataTable from '../../components/shared/DataTable.jsx';

export default function ProfitReport() {
  const [filters, setFilters] = useState({});
  const [data, setData] = useState({ bars: [], net: 0 });
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      setData((await reportApi.profit(filters)).data.data);
    } catch (err) {
      console.error('Error loading profit report:', err);
      setError(err.error?.message || 'Failed to load report');
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="d-flex flex-column h-100">
      <div className="page-toolbar d-flex align-items-center justify-content-between mb-2">
        <h1 className="h5 mb-0">Profit Report</h1>
        <strong>Net: {Number(data.net || 0).toLocaleString()}</strong>
      </div>
      <ReportFilters filters={filters} onChange={setFilters} onRun={load} />
      {error && <div className="alert alert-danger py-2 mb-2">{error}</div>}
      <div className="bg-white border rounded-2 p-2 mb-2">
        <DataTable 
          columns={[
            { key: 'label', label: 'Category' },
            { key: 'amount', label: 'Amount' }
          ]} 
          rows={[...data.bars, { label: 'Net Profit', amount: data.net }]} 
          keyField="label" 
          pageSize={20}
          disableSort={true}
          rowClassName={(row) => {
            if (row.label === 'Net Profit') {
              return row.amount >= 0 ? 'table-success fw-bold' : 'table-danger fw-bold';
            }
            return '';
          }}
        />
      </div>
      <div className="bg-white border rounded-2 p-2 flex-fill">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.bars} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="amount" fill={(entry) => {
              if (entry.label === 'Income') return '#198754';
              if (entry.label === 'Expense') return '#dc3545';
              if (entry.label === 'Worker Payments') return '#fd7e14';
              return '#0d6efd';
            }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
