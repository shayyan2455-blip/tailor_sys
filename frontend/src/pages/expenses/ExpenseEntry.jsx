import { useEffect, useState } from 'react';
import { expenseApi } from '../../api/expenseApi';
import DataTable from '../../components/shared/DataTable.jsx';
import ConfirmModal from '../../components/shared/ConfirmModal.jsx';
import { formatDate } from '../../utils/dateFormat';

const initial = { supplier_name: '', description: '', cost: '', paid_amount: '', balance: '', category: '', expense_date: new Date().toISOString().slice(0, 10) };

export default function ExpenseEntry() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

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
        { key: 'paid_amount', label: 'Paid' },
        { key: 'balance', label: 'Balance' },
        { key: 'recorded_by_name', label: 'Recorded By' }
      ]} rows={rows} actions={(row) => (
        <div className="btn-group btn-group-sm">
          <button className="btn btn-outline-secondary" type="button" onClick={() => edit(row)} title="Edit"><i className="bi bi-pencil" /></button>
          <button className="btn btn-outline-danger" type="button" onClick={() => setDeleting(row)} title="Delete"><i className="bi bi-trash" /></button>
        </div>
      )} />
      <ConfirmModal show={Boolean(deleting)} title="Delete Expense" message={`Delete ${deleting?.description || 'this expense'}?`} onClose={() => setDeleting(null)} onConfirm={remove} />
    </div>
  );
}
