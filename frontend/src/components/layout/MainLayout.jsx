import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopHeader from './TopHeader.jsx';
import Sidebar from './Sidebar.jsx';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`erp-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <TopHeader collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <div className="erp-body">
        <Sidebar collapsed={collapsed} />
        <main className="erp-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
