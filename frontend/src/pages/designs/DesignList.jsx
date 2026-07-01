import { useEffect, useState } from 'react';
import { designApi } from '../../api/designApi';
import DataTable from '../../components/shared/DataTable.jsx';
import ConfirmModal from '../../components/shared/ConfirmModal.jsx';
import DesignFormModal from './DesignFormModal.jsx';
import { useMasterData } from '../../context/MasterDataContext.jsx';
import { formatDate } from '../../utils/dateFormat';

export default function DesignList() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { invalidate } = useMasterData();

  async function load() {
    const response = await designApi.list();
    setRows(response.data.data);
  }

  useEffect(() => { load(); }, []);

  async function save(payload) {
    if (editing) await designApi.update(editing.id, payload);
    else await designApi.create(payload);
    invalidate('designs');
    await load();
  }

  async function remove() {
    await designApi.remove(deleting.id);
    setDeleting(null);
    invalidate('designs');
    await load();
  }

  return (
    <div>
      <div className="page-toolbar d-flex align-items-center justify-content-between mb-2">
        <h1 className="h5 mb-0">Designs</h1>
        <button className="btn btn-sm btn-primary" type="button" onClick={() => setEditing({})}><i className="bi bi-plus-lg me-1" />Design</button>
      </div>
      <DataTable searchable columns={[
        { key: 'name', label: 'Name' },
        { key: 'default_rate', label: 'Rate' },
        { key: 'description', label: 'Description' },
        { key: 'is_active', label: 'Status', render: (row) => <span className={`badge ${row.is_active ? 'text-bg-success' : 'text-bg-secondary'}`}>{row.is_active ? 'Active' : 'Inactive'}</span> }
      ]} rows={rows} actions={(row) => (
        <div className="btn-group btn-group-sm">
          <button className="btn btn-outline-secondary" type="button" onClick={() => setEditing(row)} title="Edit"><i className="bi bi-pencil" /></button>
          <button className="btn btn-outline-danger" type="button" onClick={() => setDeleting(row)} title="Deactivate"><i className="bi bi-x-circle" /></button>
        </div>
      )} />
      <DesignFormModal show={Boolean(editing)} record={editing?.id ? editing : null} onClose={() => setEditing(null)} onSave={save} />
      <ConfirmModal show={Boolean(deleting)} title="Deactivate Design" message={`Deactivate ${deleting?.name || 'this design'}?`} onClose={() => setDeleting(null)} onConfirm={remove} />
    </div>
  );
}
