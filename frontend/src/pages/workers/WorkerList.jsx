import { useEffect, useState } from 'react';
import { workerApi } from '../../api/workerApi';
import DataTable from '../../components/shared/DataTable.jsx';
import ConfirmModal from '../../components/shared/ConfirmModal.jsx';
import WorkerFormModal from './WorkerFormModal.jsx';
import { useMasterData } from '../../context/MasterDataContext.jsx';

export default function WorkerList() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { invalidate } = useMasterData();

  async function load() {
    const response = await workerApi.list();
    setRows(response.data);
  }

  useEffect(() => { load(); }, []);

  async function save(payload) {
    if (editing) await workerApi.update(editing.id, payload);
    else await workerApi.create(payload);
    invalidate('workers');
    await load();
  }

  async function remove() {
    await workerApi.remove(deleting.id);
    setDeleting(null);
    invalidate('workers');
    await load();
  }

  return (
    <div>
      <div className="page-toolbar d-flex align-items-center justify-content-between mb-2">
        <h1 className="h5 mb-0">Workers</h1>
        <button className="btn btn-sm btn-primary" type="button" onClick={() => setEditing({})}><i className="bi bi-plus-lg me-1" />Worker</button>
      </div>
      <DataTable columns={[
        { key: 'name', label: 'Name' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'wage_rate', label: 'Wage' },
        { key: 'is_active', label: 'Status', render: (row) => <span className={`badge ${row.is_active ? 'text-bg-success' : 'text-bg-secondary'}`}>{row.is_active ? 'Active' : 'Inactive'}</span> }
      ]} rows={rows} actions={(row) => (
        <div className="btn-group btn-group-sm">
          <button className="btn btn-outline-secondary" type="button" onClick={() => setEditing(row)} title="Edit"><i className="bi bi-pencil" /></button>
          <button className="btn btn-outline-danger" type="button" onClick={() => setDeleting(row)} title="Deactivate"><i className="bi bi-person-x" /></button>
        </div>
      )} />
      <WorkerFormModal show={Boolean(editing)} record={editing?.id ? editing : null} onClose={() => setEditing(null)} onSave={save} />
      <ConfirmModal show={Boolean(deleting)} title="Deactivate Worker" message={`Deactivate ${deleting?.name || 'this worker'}?`} onClose={() => setDeleting(null)} onConfirm={remove} />
    </div>
  );
}
