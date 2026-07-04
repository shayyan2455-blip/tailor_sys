import { useEffect, useState } from 'react';
import { reportApi } from '../../api/reportApi';
import { customerPaymentApi } from '../../api/customerPaymentApi';
import DataTable from '../../components/shared/DataTable.jsx';
import ReportFilters from './ReportFilters.jsx';
import RecoveryPaymentModal from '../../components/reports/RecoveryPaymentModal.jsx';
import CustomerPaymentHistoryModal from '../../components/reports/CustomerPaymentHistoryModal.jsx';
import { formatDate } from '../../utils/dateFormat';

export default function RecoveryReport() {
  const [filters, setFilters] = useState({});
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [payingCustomer, setPayingCustomer] = useState(null);
  const [viewingHistory, setViewingHistory] = useState(null);

  // Group data by customer to calculate total balance
  const customerBalances = rows.reduce((acc, row) => {
    const customerKey = `${row.customer_name}-${row.mobile}`;
    if (!acc[customerKey]) {
      acc[customerKey] = {
        customer_id: null,
        customer_name: row.customer_name,
        mobile: row.mobile,
        total_balance: 0,
        credit_balance: 0,
        orders: []
      };
    }
    // If row has no id, it's a credit balance entry
    if (!row.id) {
      acc[customerKey].credit_balance += Number(row.balance || 0);
      // Store customer_id from credit balance entry
      if (!acc[customerKey].customer_id && row.customer_id) {
        acc[customerKey].customer_id = row.customer_id;
      }
    } else {
      acc[customerKey].total_balance += Number(row.balance || 0);
      acc[customerKey].orders.push(row);
      // Store customer_id from the order
      if (!acc[customerKey].customer_id && row.customer_id) {
        acc[customerKey].customer_id = row.customer_id;
      }
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
      // Use customer_id from the payingCustomer object
      const customerId = payingCustomer.customer_id;
      if (!customerId) {
        alert('Customer ID not found. Please refresh the page and try again.');
        return;
      }

      await customerPaymentApi.create({
        customer_id: customerId,
        amount: paymentData.payment_amount,
        payment_type: paymentData.payment_type,
        payment_date: new Date().toISOString().split('T')[0],
        notes: `Payment from recovery report for ${payingCustomer.customer_name}`
      });

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
        { key: 'total_balance', label: 'Total Balance', render: (row) => {
          const total = row.total_balance + row.credit_balance;
          return <span className="text-danger">{total.toLocaleString()}</span>;
        }},
        { key: 'order_count', label: 'Pending Orders', render: (row) => row.orders.length }
      ]} rows={customerRows} actions={(row) => (
        <div className="btn-group btn-group-sm">
          <button className="btn btn-outline-success" type="button" onClick={() => setPayingCustomer(row)} title="Record Payment">
            <i className="bi bi-cash" />
          </button>
          <button className="btn btn-outline-secondary" type="button" onClick={() => setViewingHistory(row)} title="View Payment History">
            <i className="bi bi-clock-history" />
          </button>
        </div>
      )} />
      <RecoveryPaymentModal show={Boolean(payingCustomer)} customer={payingCustomer} onClose={() => setPayingCustomer(null)} onPayment={handlePayment} />
      <CustomerPaymentHistoryModal show={Boolean(viewingHistory)} customer={viewingHistory} onClose={() => setViewingHistory(null)} />
    </div>
  );
}
