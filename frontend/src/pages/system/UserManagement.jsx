import { useEffect, useState } from 'react';
import { authApi } from '../../api/authApi';
import DataTable from '../../components/shared/DataTable.jsx';
import FormModal from '../../components/shared/FormModal.jsx';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'Manager' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const response = await authApi.listUsers();
      setUsers(response.data.data);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit() {
    setError('');
    setBusy(true);
    try {
      await authApi.createUser(form);
      setShowModal(false);
      setForm({ username: '', password: '', role: 'Manager' });
      await load();
    } catch (err) {
      console.error('Error creating user:', err);
      // Extract validation errors from response
      const validationErrors = err?.error?.details;
      if (validationErrors && validationErrors.length > 0) {
        // Join multiple validation errors
        setError(validationErrors.map(e => e.msg).join('. '));
      } else {
        setError(err?.error?.message || 'Failed to create user.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-toolbar d-flex align-items-center justify-content-between mb-2">
        <h1 className="h5 mb-0">User Management</h1>
        <button className="btn btn-sm btn-primary" type="button" onClick={() => setShowModal(true)}>
          <i className="bi bi-person-plus me-1" /> Add User
        </button>
      </div>
      <DataTable columns={[
        { key: 'username', label: 'Username' },
        { key: 'role', label: 'Role' },
        { key: 'is_active', label: 'Active', render: (row) => row.is_active ? 'Yes' : 'No' },
        { key: 'created_at', label: 'Created', render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : '-' }
      ]} rows={users} />
      <FormModal
        show={showModal}
        title="Create New User"
        onSubmit={handleSubmit}
        onClose={() => { setShowModal(false); setError(''); setForm({ username: '', password: '', role: 'Manager' }); }}
        busy={busy}
      >
        {error && <div className="alert alert-danger py-2 small"><strong>Error:</strong> {error}</div>}
        <div className="mb-3">
          <label className="form-label small">Email (Username)</label>
          <input
            className="form-control form-control-sm"
            type="email"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
            autoFocus
            placeholder="user@example.com"
          />
          <div className="form-text small">Must be a valid email address</div>
        </div>
        <div className="mb-3">
          <label className="form-label small">Password</label>
          <input
            className="form-control form-control-sm"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
          />
          <div className="form-text small">Minimum 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol</div>
        </div>
        <div className="mb-3">
          <label className="form-label small">Role</label>
          <select
            className="form-select form-select-sm"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            required
          >
            <option value="Manager">Manager</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
      </FormModal>
    </div>
  );
}
