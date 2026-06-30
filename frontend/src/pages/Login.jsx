import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'Worker' ? '/production' : '/'} replace />;
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const loggedIn = await login(form);
      const target = location.state?.from?.pathname || (loggedIn.role === 'Worker' ? '/production' : '/');
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.error?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page d-flex align-items-center justify-content-center">
      <form className="login-panel bg-white border rounded-2 p-3" onSubmit={submit}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-scissors fs-4 text-primary" />
          <div>
            <h1 className="h5 mb-0">Tailor ERP</h1>
            <div className="small text-muted">Secure staff login</div>
          </div>
        </div>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        <label className="form-label small">Username</label>
        <input className="form-control form-control-sm mb-2" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required autoFocus />
        <label className="form-label small">Password</label>
        <input className="form-control form-control-sm mb-3" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
        <button className="btn btn-primary btn-sm w-100" type="submit" disabled={busy}>
          <i className="bi bi-box-arrow-in-right me-1" />
          Sign in
        </button>
      </form>
    </main>
  );
}
