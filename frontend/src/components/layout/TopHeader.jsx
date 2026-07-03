import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function TopHeader({ collapsed, onToggle, mobileMenuOpen, onMobileMenuToggle }) {
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="erp-header border-bottom bg-white d-flex align-items-center px-2 gap-2">
      {/* Mobile hamburger menu */}
      <button 
        className="btn btn-sm btn-outline-secondary icon-btn d-md-none" 
        type="button" 
        onClick={onMobileMenuToggle} 
        title="Menu"
      >
        <i className={`bi ${mobileMenuOpen ? 'bi-x-lg' : 'bi-list'}`} />
      </button>
      
      {/* Desktop sidebar toggle */}
      <button 
        className="btn btn-sm btn-outline-secondary icon-btn d-none d-md-flex" 
        type="button" 
        onClick={onToggle} 
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <i className={`bi ${collapsed ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar-inset-reverse'}`} />
      </button>
      
      <div className="fw-semibold d-flex align-items-center gap-2">
        <i className="bi bi-scissors text-primary" />
        <span className="d-none d-sm-inline">Tailor ERP</span>
      </div>
      <div className="ms-auto d-flex align-items-center gap-2">
        <span className="small text-muted d-none d-md-inline">{time.toLocaleString()}</span>
        {user && <span className={`badge role-${user.role} d-none d-sm-inline`}>{user.role}</span>}
        {user && <span className="small text-truncate user-chip d-none d-md-inline">{user.username}</span>}
        {user && (
          <button className="btn btn-sm btn-outline-danger icon-btn" type="button" onClick={logout} title="Logout">
            <i className="bi bi-box-arrow-right" />
          </button>
        )}
      </div>
    </header>
  );
}
