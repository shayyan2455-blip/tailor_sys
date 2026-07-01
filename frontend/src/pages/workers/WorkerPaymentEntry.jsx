import { useEffect, useState } from 'react';
import { workerPaymentApi } from '../../api/workerPaymentApi';
import { useMasterData } from '../../context/MasterDataContext.jsx';
import DataTable from '../../components/shared/DataTable.jsx';
import FormModal from '../../components/shared/FormModal.jsx';
import ConfirmModal from '../../components/shared/ConfirmModal.jsx';
import { formatDate } from '../../utils/dateFormat';

const initial = { worker_id: '', amount: 0, payment_date: new Date().toISOString().slice(0, 10), notes: '' };

export default function WorkerPaymentEntry() {
  const master = useMasterData();
  const [balances, setBalances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  async function load() {
    master.load('workers');
    const balanceResponse = await workerPaymentApi.balance();
    setBalances(balanceResponse.data.data);
    const paymentResponse = await workerPaymentApi.list();
    setPayments(paymentResponse.data.data);
  }

  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!form.worker_id || !form.amount) {
      setError('Worker and amount are required');
      return;
    }
    if (editing) await workerPaymentApi.update(editing.id, form);
    else await workerPaymentApi.create(form);
    setEditing(null);
    setForm(initial);
    setShowPaymentModal(false);
    await load();
  }

  function editPayment(row) {
    setEditing(row);
    setForm({ 
      worker_id: row.worker_id || '', 
      amount: row.amount || 0,
      payment_date: row.payment_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      notes: row.notes || ''
    });
    setShowPaymentModal(true);
  }

  function addPayment(workerId) {
    setEditing(null);
    setForm({ 
      worker_id: String(workerId), 
      amount: 0,
      payment_date: new Date().toISOString().slice(0, 10),
      notes: ''
    });
    setShowPaymentModal(true);
  }

  async function remove() {
    await workerPaymentApi.remove(deleting.id);
    setDeleting(null);
    await load();
  }

  return (
    <div>
      <div className="page-toolbar d-flex align-items-center justify-content-between mb-2">
        <h1 className="h5 mb-0">Worker Payments</h1>
      </div>
      
      {/* Worker Balance Summary */}
      <div className="bg-white border rounded-2 p-2 mb-2">
        <h6 className="mb-2">Worker Balances</h6>
        <DataTable searchable columns={[
          { key: 'worker_name', label: 'Worker' },
          { key: 'total_earnings', label: 'Total Owed' },
          { key: 'total_paid', label: 'Total Paid' },
          { key: 'balance', label: 'Remaining Balance' }
        ]} rows={balances} keyField="worker_name" actions={(row) => (
          <button 
            className="btn btn-sm btn-primary" 
            type="button" 
            onClick={() => addPayment(row.worker_id)}
            title="Add Payment"
          >
            <i className="bi bi-plus-lg" />
          </button>
        )} />
      </div>

      {/* Payment History */}
      <div className="bg-white border rounded-2 p-2">
        <h6 className="mb-2">Payment History</h6>
        <DataTable searchable columns={[
          { key: 'payment_date', label: 'Date', render: (row) => formatDate(row.payment_date) },
          { key: 'worker_name', label: 'Worker' },
          { key: 'amount', label: 'Amount' },
          { key: 'notes', label: 'Notes' },
          { key: 'recorded_by_name', label: 'Recorded By' }
        ]} rows={payments} actions={(row) => (
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-secondary" type="button" onClick={() => editPayment(row)} title="Edit">
              <i className="bi bi-pencil" />
            </button>
            <button className="btn btn-outline-danger" type="button" onClick={() => setDeleting(row)} title="Delete">
              <i className="bi bi-trash" />
            </button>
          </div>
        )} />
      </div>

      <FormModal 
        show={showPaymentModal} 
        title={editing ? 'Edit Payment' : 'Add Payment'} 
        onSubmit={submit} 
        onClose={() => { setShowPaymentModal(false); setEditing(null); setForm(initial); }} 
        busy={false}
        error={error}
      >
        <div className="row g-2">
          <div className="col-md-6">
            <label className="form-label small">Worker</label>
            <select 
              className="form-select form-select-sm" 
              value={form.worker_id} 
              onChange={(event) => setForm({ ...form, worker_id: event.target.value })}
              disabled={!!editing}
              required
            >
              <option value="">Select worker</option>
              {master.workers.filter(w => w.is_active).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label small">Amount</label>
            <input 
              className="form-control form-control-sm" 
              type="number" 
              min="0.01" 
              step="0.01" 
              value={form.amount} 
              onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} 
              required 
            />
          </div>
          <div className="col-md-6">
            <label className="form-label small">Date</label>
            <input 
              className="form-control form-control-sm" 
              type="date" 
              value={form.payment_date} 
              onChange={(event) => setForm({ ...form, payment_date: event.target.value })} 
              required 
            />
          </div>
          <div className="col-md-6">
            <label className="form-label small">Notes</label>
            <input 
              className="form-control form-control-sm" 
              value={form.notes} 
              onChange={(event) => setForm({ ...form, notes: event.target.value })} 
              placeholder="Optional"
            />
          </div>
        </div>
      </FormModal>
      <ConfirmModal 
        show={Boolean(deleting)} 
        title="Delete Payment" 
        message={`Delete payment of ${deleting?.amount} to ${deleting?.worker_name}?`} 
        onClose={() => setDeleting(null)} 
        onConfirm={remove} 
      />
    </div>
  );
}
