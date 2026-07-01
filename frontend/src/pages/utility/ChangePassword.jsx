import { useState } from 'react';
import { authApi } from '../../api/authApi';

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    await authApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setMessage('Password changed');
  }

  return (
    <form className="bg-white border rounded-2 p-3 password-form" onSubmit={submit}>
      <h1 className="h5 mb-3">Change Password</h1>
      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      {message && <div className="alert alert-success py-2 small">{message}</div>}
      <label className="form-label small">Current Password</label>
      <input className="form-control form-control-sm mb-2" type="password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} required />
      <label className="form-label small">New Password</label>
      <input className="form-control form-control-sm mb-2" type="password" minLength="8" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} required />
      <label className="form-label small">Confirm Password</label>
      <input className="form-control form-control-sm mb-3" type="password" minLength="8" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} required />
      <button className="btn btn-sm btn-primary" type="submit"><i className="bi bi-key me-1" />Update Password</button>
    </form>
  );
}
