// Fabric list page component
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fabricApi } from '../../api/fabricApi';
import DataTable from '../../components/shared/DataTable.jsx';
import ConfirmModal from '../../components/shared/ConfirmModal.jsx';
import FabricFormModal from './FabricFormModal.jsx';
import { useMasterData } from '../../context/MasterDataContext.jsx';
import { formatDate } from '../../utils/dateFormat';

export default function FabricList() {
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { invalidate } = useMasterData();
  const createRequested = searchParams.get('new') === '1';

  async function load() {
    const response = await fabricApi.list();
    setRows(response.data.data);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (createRequested) setEditing({});
  }, [createRequested]);

  async function save(payload) {
    if (editing?.id) await fabricApi.update(editing.id, payload);
    else await fabricApi.create(payload);
    invalidate('fabrics');
    await load();
  }

  async function remove() {
    await fabricApi.remove(deleting.id);
    setDeleting(null);
    invalidate('fabrics');
    await load();
  }

  return (
    <div>
      <div className="page-toolbar d-flex align-items-center justify-content-between mb-2">
        <h1 className="h5 mb-0">Fabrics</h1>
        <button className="btn btn-sm btn-primary" type="button" onClick={() => setEditing({})}><i className="bi bi-plus-lg me-1" />Fabric</button>
      </div>
      <DataTable searchable columns={[
        { key: 'name', label: 'Name' },
        { key: 'cost_per_unit', label: 'Cost / Unit' },
        { key: 'supplier', label: 'Supplier' },
        { key: 'is_active', label: 'Status', render: (row) => <span className={`badge ${row.is_active ? 'text-bg-success' : 'text-bg-secondary'}`}>{row.is_active ? 'Active' : 'Inactive'}</span> }
      ]} rows={rows} actions={(row) => (
        <div className="btn-group btn-group-sm">
          <button className="btn btn-outline-secondary" type="button" onClick={() => setEditing(row)} title="Edit"><i className="bi bi-pencil" /></button>
          <button className="btn btn-outline-danger" type="button" onClick={() => setDeleting(row)} title="Deactivate"><i className="bi bi-x-circle" /></button>
        </div>
      )} />
      <FabricFormModal show={Boolean(editing)} record={editing?.id ? editing : null} onClose={() => setEditing(null)} onSave={save} />
      <ConfirmModal show={Boolean(deleting)} title="Deactivate Fabric" message={`Deactivate ${deleting?.name || 'this fabric'}?`} onClose={() => setDeleting(null)} onConfirm={remove} />
    </div>
  );
}
