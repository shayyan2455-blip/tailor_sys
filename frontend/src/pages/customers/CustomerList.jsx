import { useEffect, useState } from 'react';
import { customerApi } from '../../api/customerApi';
import DataTable from '../../components/shared/DataTable.jsx';
import ConfirmModal from '../../components/shared/ConfirmModal.jsx';
import CustomerFormModal from './CustomerFormModal.jsx';
import { useMasterData } from '../../context/MasterDataContext.jsx';

export default function CustomerList() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { invalidate } = useMasterData();

  async function load() {
    const response = await customerApi.list();
    setRows(response.data);
  }

  useEffect(() => { load(); }, []);

  async function save(payload) {
    if (editing) await customerApi.update(editing.id, payload);
    else await customerApi.create(payload);
    invalidate('customers');
    await load();
  }

  async function remove() {
    await customerApi.remove(deleting.id);
    setDeleting(null);
    invalidate('customers');
    await load();
  }

  return (
    <div>
      <div className="page-toolbar d-flex align-items-center justify-content-between mb-2">
        <h1 className="h5 mb-0">Customers</h1>
        <button className="btn btn-sm btn-primary" type="button" onClick={() => setEditing({})}><i className="bi bi-plus-lg me-1" />Customer</button>
      </div>
      <DataTable columns={[
        { key: 'name', label: 'Name' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'address', label: 'Address' }
      ]} rows={rows} actions={(row) => (
        <div className="btn-group btn-group-sm">
          <button className="btn btn-outline-secondary" type="button" onClick={() => setEditing(row)} title="Edit"><i className="bi bi-pencil" /></button>
          <button className="btn btn-outline-danger" type="button" onClick={() => setDeleting(row)} title="Delete"><i className="bi bi-trash" /></button>
        </div>
      )} />
      <CustomerFormModal show={Boolean(editing)} record={editing?.id ? editing : null} onClose={() => setEditing(null)} onSave={save} />
      <ConfirmModal show={Boolean(deleting)} title="Delete Customer" message={`Delete ${deleting?.name || 'this customer'}?`} onClose={() => setDeleting(null)} onConfirm={remove} />
    </div>
  );
}
