import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'bi-speedometer2', roles: ['Admin', 'Manager'], end: true },
  { to: '/orders/new', label: 'Order Booking', icon: 'bi-journal-plus', roles: ['Admin', 'Manager'], end: true },
  { to: '/orders', label: 'Orders', icon: 'bi-receipt', roles: ['Admin', 'Manager'], end: true },
  { to: '/production', label: 'Production Hub', icon: 'bi-kanban', roles: ['Admin', 'Manager', 'Worker'], end: true },
  { to: '/delivery', label: 'Delivery', icon: 'bi-truck', roles: ['Admin', 'Manager'], end: true },
  { to: '/billing', label: 'Billing', icon: 'bi-cash-stack', roles: ['Admin', 'Manager'], end: true },
  { to: '/expenses', label: 'Expenses', icon: 'bi-wallet2', roles: ['Admin', 'Manager'], end: true },
  { to: '/customers', label: 'Customers', icon: 'bi-people', roles: ['Admin', 'Manager'], end: true },
  { to: '/workers', label: 'Workers', icon: 'bi-person-badge', roles: ['Admin', 'Manager'], end: true },
  { to: '/workers/payments', label: 'Worker Payments', icon: 'bi-cash-coin', roles: ['Admin', 'Manager'], end: true },
  { to: '/designs', label: 'Designs', icon: 'bi-palette', roles: ['Admin', 'Manager'], end: true },
  { to: '/fabrics', label: 'Fabrics', icon: 'bi-layers', roles: ['Admin', 'Manager'], end: true },
  { to: '/reports/pending', label: 'Pending', icon: 'bi-hourglass-split', roles: ['Admin', 'Manager'], end: true },
  { to: '/reports/ready', label: 'Ready', icon: 'bi-check2-square', roles: ['Admin', 'Manager'], end: true },
  { to: '/reports/delivered', label: 'Delivered', icon: 'bi-box-seam', roles: ['Admin', 'Manager'], end: true },
  { to: '/reports/recovery', label: 'Recovery', icon: 'bi-graph-up-arrow', roles: ['Admin', 'Manager'], end: true },
  { to: '/reports/worker-ledger', label: 'Worker Ledger', icon: 'bi-clipboard-data', roles: ['Admin', 'Manager'], end: true },
  { to: '/reports/profit', label: 'Profit', icon: 'bi-bar-chart', roles: ['Admin'], end: true },
  { to: '/system/users', label: 'User Management', icon: 'bi-person-gear', roles: ['Admin'], end: true },
  { to: '/utility/backup', label: 'Backup', icon: 'bi-database-down', roles: ['Admin'], end: true },
  { to: '/utility/change-password', label: 'Password', icon: 'bi-key', roles: ['Admin', 'Manager', 'Worker'], end: true },
  { to: '/system/config', label: 'System Config', icon: 'bi-sliders', roles: ['Admin'], end: true }
];

export default function Sidebar({ collapsed }) {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role;
  const visible = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className={`erp-sidebar border-end bg-white ${collapsed ? 'collapsed' : ''}`}>
      <nav className="nav nav-pills flex-column gap-1 p-2">
        {visible.map((item) => (
          <NavLink 
            key={item.to} 
            to={item.to} 
            end={item.end}
            className={({ isActive }) => {
              // For Order Booking (/orders/new), only highlight if exact match
              // For Orders (/orders), highlight if current path is exactly /orders
              // For other routes, use default behavior
              if (item.to === '/orders/new') {
                return `nav-link d-flex align-items-center gap-2 ${location.pathname === '/orders/new' ? 'active' : ''}`;
              }
              if (item.to === '/orders') {
                return `nav-link d-flex align-items-center gap-2 ${location.pathname === '/orders' ? 'active' : ''}`;
              }
              return `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : ''}`;
            }}
            title={collapsed ? item.label : undefined}
          >
            <i className={`bi ${item.icon}`} />
            {!collapsed && <span className="text-truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
