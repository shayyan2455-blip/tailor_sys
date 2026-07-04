import { useEffect, useState } from 'react';
import { workerApi } from '../../api/workerApi';
import DataTable from '../../components/shared/DataTable.jsx';
import ConfirmModal from '../../components/shared/ConfirmModal.jsx';
import WorkerFormModal from './WorkerFormModal.jsx';
import CreateWorkerUserModal from './CreateWorkerUserModal.jsx';
import { useMasterData } from '../../context/MasterDataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDate } from '../../utils/dateFormat';

export default function WorkerList() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [creatingUser, setCreatingUser] = useState(null);
  const { invalidate } = useMasterData();
  const { user } = useAuth();

  async function load() {
    try {
      const response = await workerApi.list();
      setRows(response.data.data);
    } catch (err) {
      console.error('Error loading workers:', err);
    }
  }

  useEffect(() => { load(); }, []);

  async function save(payload) {
    if (editing?.id) await workerApi.update(editing.id, payload);
    else await workerApi.create(payload);
    invalidate('workers');
    await load();
  }

  async function toggleStatus() {
    await workerApi.update(toggling.id, { is_active: !toggling.is_active });
    setToggling(null);
    invalidate('workers');
    await load();
  }

  return (
    <div>
      <div className="page-toolbar d-flex align-items-center justify-content-between mb-2">
        <h1 className="h5 mb-0">Workers</h1>
        <button className="btn btn-sm btn-primary" type="button" onClick={() => setEditing({})}><i className="bi bi-plus-lg me-1" />Worker</button>
      </div>
      <DataTable searchable columns={[
        { key: 'name', label: 'Name' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'wage_rate', label: 'Wage' },
        { key: 'is_active', label: 'Status', render: (row) => <span className={`badge ${row.is_active ? 'text-bg-success' : 'text-bg-secondary'}`}>{row.is_active ? 'Active' : 'Inactive'}</span> }
      ]} rows={rows} actions={(row) => (
        <div className="btn-group btn-group-sm">
          <button className="btn btn-outline-secondary" type="button" onClick={() => setEditing(row)} title="Edit"><i className="bi bi-pencil" /></button>
          {user?.role === 'Admin' && <button className="btn btn-outline-primary" type="button" onClick={() => setCreatingUser(row)} title="Create User Account"><i className="bi bi-person-plus" /></button>}
          <button 
            className={`btn ${row.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`} 
            type="button" 
            onClick={() => setToggling(row)} 
            title={row.is_active ? 'Deactivate' : 'Activate'}
          >
            <i className={`bi ${row.is_active ? 'bi-person-x' : 'bi-person-check'}`} />
          </button>
        </div>
      )} />
      <WorkerFormModal show={Boolean(editing)} record={editing?.id ? editing : null} onClose={() => setEditing(null)} onSave={save} />
      <CreateWorkerUserModal show={Boolean(creatingUser)} worker={creatingUser} onClose={() => setCreatingUser(null)} />
      <ConfirmModal 
        show={Boolean(toggling)} 
        title={toggling?.is_active ? 'Deactivate Worker' : 'Activate Worker'} 
        message={`${toggling?.is_active ? 'Deactivate' : 'Activate'} ${toggling?.name || 'this worker'}?`} 
        onClose={() => setToggling(null)} 
        onConfirm={toggleStatus} 
      />
    </div>
  );
}
