import { useState } from 'react';
import FormModal from '../../components/shared/FormModal.jsx';
import { authApi } from '../../api/authApi';

export default function CreateWorkerUserModal({ show, worker, onClose }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!form.username.trim() || !form.password.trim()) {
      setError('Username and password are required');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters, with 1 uppercase, 1 lowercase, 1 number, 1 symbol');
      return;
    }
    setBusy(true);
    try {
      await authApi.createWorkerUser({
        worker_id: worker.id,
        username: form.username,
        password: form.password
      });
      setForm({ username: '', password: '' });
      onClose();
    } catch (err) {
      const validationErrors = err?.error?.details;
      if (validationErrors && validationErrors.length > 0) {
        setError(validationErrors.map(e => e.msg).join('. '));
      } else {
        setError(err?.error?.message || 'Unable to create user account');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormModal show={show} title={worker ? `Create User Account for ${worker.name}` : 'Create User Account'} onSubmit={submit} onClose={onClose} busy={busy} error={error}>
      <div className="row g-2">
        <div className="col-12">
          <label className="form-label small">Username</label>
          <input 
            className="form-control form-control-sm" 
            value={form.username} 
            onChange={(event) => setForm({ ...form, username: event.target.value })} 
            required 
            placeholder="Enter login username"
          />
        </div>
        <div className="col-12">
          <label className="form-label small">Password</label>
          <input 
            className="form-control form-control-sm" 
            type="password" 
            value={form.password} 
            onChange={(event) => setForm({ ...form, password: event.target.value })} 
            required 
            placeholder="Min 8 chars, 1 upper, 1 lower, 1 num, 1 sym"
          />
        </div>
      </div>
    </FormModal>
  );
}
