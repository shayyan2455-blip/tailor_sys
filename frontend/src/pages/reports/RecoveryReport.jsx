import { useEffect, useState } from 'react';
import { reportApi } from '../../api/reportApi';
import { paymentApi } from '../../api/paymentApi';
import DataTable from '../../components/shared/DataTable.jsx';
import ReportFilters from './ReportFilters.jsx';
import RecoveryPaymentModal from '../../components/reports/RecoveryPaymentModal.jsx';
import { formatDate } from '../../utils/dateFormat';

export default function RecoveryReport() {
  const [filters, setFilters] = useState({});
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [payingCustomer, setPayingCustomer] = useState(null);

  // Group data by customer to calculate total balance
  const customerBalances = rows.reduce((acc, row) => {
    const customerKey = `${row.customer_name}-${row.mobile}`;
    if (!acc[customerKey]) {
      acc[customerKey] = {
        customer_id: row.id ? null : null, // Will be set from credit balance entries
        customer_name: row.customer_name,
        mobile: row.mobile,
        total_balance: 0,
        orders: []
      };
    }
    acc[customerKey].total_balance += Number(row.balance || 0);
    if (row.id) {
      acc[customerKey].orders.push(row);
    }
    return acc;
  }, {});

  const customerRows = Object.values(customerBalances);

  async function load() {
    try {
      setError('');
      setRows((await reportApi.recovery(filters)).data.data);
    } catch (err) {
      console.error('Error loading recovery report:', err);
      setError(err.error?.message || 'Failed to load report');
    }
  }

  async function handlePayment(paymentData) {
    try {
      // For now, we'll record this as a payment against the first order with balance
      // In a real implementation, you'd need a separate customer payments table
      const customerOrders = customerRows.find(c => c.customer_name === payingCustomer.customer_name && c.mobile === payingCustomer.mobile)?.orders || [];
      if (customerOrders.length > 0) {
        await paymentApi.create({
          order_id: customerOrders[0].id,
          amount: paymentData.payment_amount,
          payment_type: paymentData.payment_type,
          payment_date: new Date().toISOString().split('T')[0]
        });
      }
      setPayingCustomer(null);
      await load();
    } catch (err) {
      console.error('Error recording payment:', err);
      alert(err.error?.message || 'Failed to record payment');
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
        { key: 'customer_name', label: 'Customer' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'total_balance', label: 'Total Balance', render: (row) => <span className="text-danger">{row.total_balance.toLocaleString()}</span> },
        { key: 'order_count', label: 'Pending Orders', render: (row) => row.orders.length }
      ]} rows={customerRows} actions={(row) => (
        <button className="btn btn-sm btn-success" type="button" onClick={() => setPayingCustomer(row)} title="Record Payment">
          <i className="bi bi-cash" />
        </button>
      )} />
      <RecoveryPaymentModal show={Boolean(payingCustomer)} customer={payingCustomer} onClose={() => setPayingCustomer(null)} onPayment={handlePayment} />
    </div>
  );
}
