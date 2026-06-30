import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function TopHeader({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="erp-header border-bottom bg-white d-flex align-items-center px-2 gap-2">
      <button className="btn btn-sm btn-outline-secondary icon-btn" type="button" onClick={onToggle} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        <i className={`bi ${collapsed ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar-inset-reverse'}`} />
      </button>
      <div className="fw-semibold d-flex align-items-center gap-2">
        <i className="bi bi-scissors text-primary" />
        <span>Tailor ERP</span>
      </div>
      <div className="ms-auto d-flex align-items-center gap-2">
        <span className="small text-muted d-none d-md-inline">{time.toLocaleString()}</span>
        {user && <span className={`badge role-${user.role}`}>{user.role}</span>}
        {user && <span className="small text-truncate user-chip">{user.username}</span>}
        {user && (
          <button className="btn btn-sm btn-outline-danger icon-btn" type="button" onClick={logout} title="Logout">
            <i className="bi bi-box-arrow-right" />
          </button>
        )}
      </div>
    </header>
  );
}
