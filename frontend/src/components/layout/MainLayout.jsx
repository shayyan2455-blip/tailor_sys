import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import TopHeader from './TopHeader.jsx';
import Sidebar from './Sidebar.jsx';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className={`erp-shell ${collapsed ? 'sidebar-collapsed' : ''} ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      <TopHeader 
        collapsed={collapsed} 
        onToggle={() => setCollapsed((value) => !value)}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={toggleMobileMenu}
      />
      <div className="erp-body">
        <Sidebar collapsed={collapsed} mobileMenuOpen={mobileMenuOpen} />
        <main className="erp-main">
          <Outlet />
        </main>
      </div>
      <footer className="erp-footer">
        <div className="erp-footer-content">
          <span className="erp-footer-text">A service by </span>
          <span className="erp-footer-brand">Liberal Tech</span>
        </div>
      </footer>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={toggleMobileMenu}
        />
      )}
    </div>
  );
}
