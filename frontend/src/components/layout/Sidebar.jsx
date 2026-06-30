import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'bi-speedometer2', roles: ['Admin', 'Manager'] },
  { to: '/orders/new', label: 'Order Booking', icon: 'bi-journal-plus', roles: ['Admin', 'Manager'] },
  { to: '/orders', label: 'Orders', icon: 'bi-receipt', roles: ['Admin', 'Manager'] },
  { to: '/production', label: 'Production Hub', icon: 'bi-kanban', roles: ['Admin', 'Manager', 'Worker'] },
  { to: '/delivery', label: 'Delivery', icon: 'bi-truck', roles: ['Admin', 'Manager'] },
  { to: '/billing', label: 'Billing', icon: 'bi-cash-stack', roles: ['Admin', 'Manager'] },
  { to: '/expenses', label: 'Expenses', icon: 'bi-wallet2', roles: ['Admin', 'Manager'] },
  { to: '/customers', label: 'Customers', icon: 'bi-people', roles: ['Admin', 'Manager'] },
  { to: '/workers', label: 'Workers', icon: 'bi-person-badge', roles: ['Admin', 'Manager'] },
  { to: '/designs', label: 'Designs', icon: 'bi-palette', roles: ['Admin', 'Manager'] },
  { to: '/fabrics', label: 'Fabrics', icon: 'bi-layers', roles: ['Admin', 'Manager'] },
  { to: '/reports/pending', label: 'Pending', icon: 'bi-hourglass-split', roles: ['Admin', 'Manager'] },
  { to: '/reports/ready', label: 'Ready', icon: 'bi-check2-square', roles: ['Admin', 'Manager'] },
  { to: '/reports/delivered', label: 'Delivered', icon: 'bi-box-seam', roles: ['Admin', 'Manager'] },
  { to: '/reports/recovery', label: 'Recovery', icon: 'bi-graph-up-arrow', roles: ['Admin', 'Manager'] },
  { to: '/reports/worker-ledger', label: 'Worker Ledger', icon: 'bi-clipboard-data', roles: ['Admin', 'Manager'] },
  { to: '/reports/profit', label: 'Profit', icon: 'bi-bar-chart', roles: ['Admin'] },
  { to: '/utility/backup', label: 'Backup', icon: 'bi-database-down', roles: ['Admin'] },
  { to: '/utility/change-password', label: 'Password', icon: 'bi-key', roles: ['Admin', 'Manager', 'Worker'] },
  { to: '/system/config', label: 'System Config', icon: 'bi-sliders', roles: ['Admin'] }
];

export default function Sidebar({ collapsed }) {
  const { user } = useAuth();
  const role = user?.role;
  const visible = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className={`erp-sidebar border-end bg-white ${collapsed ? 'collapsed' : ''}`}>
      <nav className="nav nav-pills flex-column gap-1 p-2">
        {visible.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className="nav-link d-flex align-items-center gap-2" title={collapsed ? item.label : undefined}>
            <i className={`bi ${item.icon}`} />
            {!collapsed && <span className="text-truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
