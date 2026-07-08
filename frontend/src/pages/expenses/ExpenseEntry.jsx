import { useEffect, useState } from 'react';
import { expenseApi } from '../../api/expenseApi';
import { expensePaymentApi } from '../../api/expensePaymentApi';
import DataTable from '../../components/shared/DataTable.jsx';
import ConfirmModal from '../../components/shared/ConfirmModal.jsx';
import { formatDate } from '../../utils/dateFormat';

const initial = { supplier_name: '', description: '', cost: '', paid_amount: '', balance: '', category: '', expense_date: new Date().toISOString().slice(0, 10) };
const paymentInitial = { amount: '', payment_type: 'Cash', notes: '', payment_date: new Date().toISOString().slice(0, 10) };

export default function ExpenseEntry() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentForm, setPaymentForm] = useState(paymentInitial);
  const [payments, setPayments] = useState([]);
  const [paymentError, setPaymentError] = useState('');

  async function load() {
    const response = await expenseApi.list();
    setRows(response.data.data);
  }

  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!form.description.trim() || !form.category.trim()) {
      setError('Description and category are required');
      return;
    }
    if (editing) await expenseApi.update(editing.id, form);
    else await expenseApi.create(form);
    setEditing(null);
    setForm(initial);
    await load();
  }

  function edit(row) {
    setEditing(row);
    setForm({ 
      supplier_name: row.supplier_name || '', 
      description: row.description, 
      cost: row.cost || 0, 
      paid_amount: row.paid_amount || 0, 
      balance: row.balance || 0,
      category: row.category, 
      expense_date: row.expense_date?.slice(0, 10) 
    });
  }

  async function remove() {
    await expenseApi.remove(deleting.id);
    setDeleting(null);
    await load();
  }

  async function openPaymentModal(expense) {
    setPaymentModal(expense);
    setPaymentForm(paymentInitial);
    setPaymentError('');
    try {
      const response = await expensePaymentApi.list(expense.id);
      setPayments(response.data.data || []);
    } catch (error) {
      console.error('Failed to load payments:', error);
      setPayments([]);
    }
  }

  async function submitPayment(event) {
    event.preventDefault();
    setPaymentError('');
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      setPaymentError('Amount must be greater than 0');
      return;
    }
    if (Number(paymentForm.amount) > paymentModal.balance) {
      setPaymentError(`Payment amount cannot exceed remaining balance (${paymentModal.balance})`);
      return;
    }
    try {
      await expensePaymentApi.create(paymentModal.id, paymentForm);
      setPaymentModal(null);
      setPaymentForm(paymentInitial);
      await load();
    } catch (error) {
      setPaymentError(error?.error?.message || 'Failed to add payment');
    }
  }

  return (
    <div>
      <div className="page-toolbar d-flex align-items-center justify-content-between mb-2">
        <h1 className="h5 mb-0">Expenses</h1>
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
      <form className="bg-white border rounded-2 p-2 mb-2" onSubmit={submit}>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        <div className="row g-2 align-items-end">
          <div className="col-md-3"><label className="form-label small">Supplier Name</label><input className="form-control form-control-sm" value={form.supplier_name} onChange={(event) => setForm({ ...form, supplier_name: event.target.value })} placeholder="Optional" /></div>
          <div className="col-md-3"><label className="form-label small">Description</label><input className="form-control form-control-sm" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required /></div>
          <div className="col-md-2"><label className="form-label small">Cost</label><input className="form-control form-control-sm" type="number" min="0" step="0.01" value={form.cost} onChange={(event) => setForm({ ...form, cost: Number(event.target.value), balance: Number(event.target.value) - form.paid_amount })} required /></div>
          <div className="col-md-2"><label className="form-label small">Paid Amount</label><input className="form-control form-control-sm" type="number" min="0" step="0.01" value={form.paid_amount} onChange={(event) => setForm({ ...form, paid_amount: Number(event.target.value), balance: form.cost - Number(event.target.value) })} required /></div>
          <div className="col-md-2"><label className="form-label small">Balance</label><input className="form-control form-control-sm" type="number" min="0" step="0.01" value={form.balance} readOnly /></div>
          <div className="col-md-2"><label className="form-label small">Category</label><input className="form-control form-control-sm" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required /></div>
          <div className="col-md-2"><label className="form-label small">Date</label><input className="form-control form-control-sm" type="date" value={form.expense_date} onChange={(event) => setForm({ ...form, expense_date: event.target.value })} required /></div>
          <div className="col-md-2 d-flex gap-1">
            <button className="btn btn-sm btn-primary flex-fill" type="submit"><i className="bi bi-save me-1" />{editing ? 'Update' : 'Add'}</button>
            {editing && <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => { setEditing(null); setForm(initial); }}><i className="bi bi-x-lg" /></button>}
          </div>
        </div>
      </form>
      <DataTable searchable search={search} columns={[
        { key: 'expense_date', label: 'Date', render: (row) => formatDate(row.expense_date) },
        { key: 'supplier_name', label: 'Supplier' },
        { key: 'description', label: 'Description' },
        { key: 'category', label: 'Category' },
        { key: 'cost', label: 'Cost' },
        { key: 'total_paid', label: 'Total Paid' },
        { key: 'balance', label: 'Balance' },
        { key: 'recorded_by_name', label: 'Recorded By' }
      ]} rows={rows} actions={(row) => (
        <div className="btn-group btn-group-sm">
          <button className="btn btn-outline-success" type="button" onClick={() => openPaymentModal(row)} title="Add Payment" disabled={row.balance <= 0}><i className="bi bi-cash-coin" /></button>
          <button className="btn btn-outline-secondary" type="button" onClick={() => edit(row)} title="Edit"><i className="bi bi-pencil" /></button>
          <button className="btn btn-outline-danger" type="button" onClick={() => setDeleting(row)} title="Delete"><i className="bi bi-trash" /></button>
        </div>
      )} />
      <ConfirmModal show={Boolean(deleting)} title="Delete Expense" message={`Delete ${deleting?.description || 'this expense'}?`} onClose={() => setDeleting(null)} onConfirm={remove} />
      
      {/* Payment Modal */}
      {paymentModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Payment - {paymentModal.description}</h5>
                <button type="button" className="btn-close" onClick={() => setPaymentModal(null)} />
              </div>
              <div className="modal-body">
                {paymentError && <div className="alert alert-danger py-2 small">{paymentError}</div>}
                <div className="mb-3">
                  <label className="form-label small">Total Cost</label>
                  <input className="form-control form-control-sm" value={paymentModal.cost} readOnly />
                </div>
                <div className="mb-3">
                  <label className="form-label small">Already Paid</label>
                  <input className="form-control form-control-sm" value={paymentModal.total_paid || 0} readOnly />
                </div>
                <div className="mb-3">
                  <label className="form-label small">Remaining Balance</label>
                  <input className="form-control form-control-sm" value={paymentModal.balance} readOnly />
                </div>
                <form onSubmit={submitPayment}>
                  <div className="mb-3">
                    <label className="form-label small">Payment Amount</label>
                    <input 
                      className="form-control form-control-sm" 
                      type="number" 
                      min="0.01" 
                      step="0.01" 
                      max={paymentModal.balance}
                      value={paymentForm.amount} 
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Payment Type</label>
                    <select 
                      className="form-select form-select-sm" 
                      value={paymentForm.payment_type} 
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_type: e.target.value })}
                      required
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Check">Check</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Payment Date</label>
                    <input 
                      className="form-control form-control-sm" 
                      type="date" 
                      value={paymentForm.payment_date} 
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Notes</label>
                    <textarea 
                      className="form-control form-control-sm" 
                      rows="2"
                      value={paymentForm.notes} 
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      placeholder="Optional notes"
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary btn-sm">Add Payment</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPaymentModal(null)}>Cancel</button>
                  </div>
                </form>
                
                {payments.length > 0 && (
                  <div className="mt-4">
                    <h6 className="small mb-2">Payment History</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Type</th>
                            <th>Recorded By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment) => (
                            <tr key={payment.id}>
                              <td>{formatDate(payment.payment_date)}</td>
                              <td>{Number(payment.amount).toFixed(2)}</td>
                              <td>{payment.payment_type}</td>
                              <td>{payment.recorded_by_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
