import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { navItems } from './Sidebar.jsx';

const routeDetails = [
  { path: '/', title: 'Dashboard', subtitle: 'Overview of your business' },
  { path: '/orders/new', title: 'Order Booking', subtitle: 'Create and schedule a new order' },
  { path: '/orders', title: 'Orders', subtitle: 'Track customer orders and balances' },
  { path: '/production', title: 'Production Hub', subtitle: 'Manage work stages and assignments' },
  { path: '/delivery', title: 'Delivery', subtitle: 'Finalize ready orders for customers' },
  { path: '/billing', title: 'Billing', subtitle: 'Record payments and view invoices' },
  { path: '/expenses', title: 'Expenses', subtitle: 'Capture operational spending' },
  { path: '/customers', title: 'Customers', subtitle: 'Manage customer records and measurements' },
  { path: '/workers', title: 'Workers', subtitle: 'Manage workers and workshop users' },
  { path: '/workers/payments', title: 'Worker Payments', subtitle: 'Record worker payouts and deductions' },
  { path: '/designs', title: 'Designs', subtitle: 'Maintain garment design options' },
  { path: '/fabrics', title: 'Fabrics', subtitle: 'Maintain fabric inventory references' },
  { path: '/reports/pending', title: 'Pending Orders', subtitle: 'Review orders still in progress' },
  { path: '/reports/ready', title: 'Ready Orders', subtitle: 'Review orders ready for delivery' },
  { path: '/reports/delivered', title: 'Delivered Orders', subtitle: 'Review completed deliveries' },
  { path: '/reports/recovery', title: 'Recovery Report', subtitle: 'Monitor customer receivables' },
  { path: '/reports/worker-ledger', title: 'Worker Ledger', subtitle: 'Review worker production balances' },
  { path: '/reports/profit', title: 'Profit Report', subtitle: 'Analyze sales, costs, and profit' },
  { path: '/system/users', title: 'User Management', subtitle: 'Control staff access and roles' },
  { path: '/utility/backup', title: 'Backup Utility', subtitle: 'Create and manage data backups' },
  { path: '/utility/change-password', title: 'Change Password', subtitle: 'Update your account credentials' },
  { path: '/system/config', title: 'System Config', subtitle: 'Configure tailoring system settings' }
];

function getRouteDetails(pathname) {
  if (/^\/orders\/[^/]+$/.test(pathname)) {
    return { title: 'Order Detail', subtitle: 'Review order items, payments, and measurements' };
  }

  return routeDetails.find((route) => route.path === pathname) || {
    title: 'Tailor ERP',
    subtitle: 'Manage your tailoring operations'
  };
}

export default function TopHeader({ collapsed, onToggle, mobileMenuOpen, onMobileMenuToggle }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const page = getRouteDetails(location.pathname);

  const searchableItems = useMemo(() => {
    const role = user?.role;
    return navItems
      .filter((item) => item.roles.includes(role))
      .map((item) => {
        const details = getRouteDetails(item.to);
        return {
          ...item,
          title: details.title,
          subtitle: details.subtitle,
          searchText: `${item.label} ${details.title} ${details.subtitle} ${item.to}`.toLowerCase()
        };
      });
  }, [user?.role]);

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    const results = query
      ? searchableItems.filter((item) => item.searchText.includes(query))
      : searchableItems;

    return results.slice(0, 8);
  }, [search, searchableItems]);

  const goToSearchResult = (item) => {
    if (!item) return;
    navigate(item.to);
    setSearch('');
    setSearchOpen(false);
    setActiveSearchIndex(0);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    goToSearchResult(searchResults[activeSearchIndex] || searchResults[0]);
  };

  const handleSearchKeyDown = (event) => {
    if (!searchResults.length && ['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) {
      return;
    }

    if (!searchOpen && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      setSearchOpen(true);
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSearchIndex((index) => Math.min(index + 1, searchResults.length - 1));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSearchIndex((index) => Math.max(index - 1, 0));
    }

    if (event.key === 'Escape') {
      setSearchOpen(false);
      setActiveSearchIndex(0);
    }
  };

  const handleSearchBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setSearchOpen(false);
      setActiveSearchIndex(0);
    }
  };

  return (
    <header className="erp-header border-bottom bg-white d-flex align-items-center">
      <div className="erp-header-title d-flex align-items-center">
        <button
          className="btn erp-menu-button icon-btn d-md-none"
          type="button"
          onClick={onMobileMenuToggle}
          title="Menu"
          aria-label="Toggle menu"
        >
          <i className={`bi ${mobileMenuOpen ? 'bi-x-lg' : 'bi-list'}`} />
        </button>

        <button
          className="btn erp-menu-button icon-btn d-none d-md-flex"
          type="button"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className="bi bi-list" />
        </button>

        <div className="erp-page-copy">
          <h1 className="erp-page-title mb-0">{page.title}</h1>
          <p className="erp-page-subtitle mb-0">{page.subtitle}</p>
        </div>
      </div>

      <div className="erp-header-actions ms-auto d-flex align-items-center">
        <form
          className="erp-header-search d-none d-lg-flex"
          role="search"
          onSubmit={handleSearchSubmit}
          onBlur={handleSearchBlur}
        >
          <input
            className="form-control"
            type="search"
            placeholder="Search..."
            aria-label="Search pages"
            aria-controls="header-search-results"
            aria-expanded={searchOpen && searchResults.length > 0}
            aria-activedescendant={searchOpen && searchResults[activeSearchIndex] ? `header-search-result-${activeSearchIndex}` : undefined}
            autoComplete="off"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setSearchOpen(true);
              setActiveSearchIndex(0);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={handleSearchKeyDown}
          />
          <button className="btn icon-btn" type="submit" title="Search" aria-label="Search">
            <i className="bi bi-search" />
          </button>

          {searchOpen && (
            <div className="erp-search-results shadow-sm" id="header-search-results" role="listbox">
              {searchResults.length > 0 ? (
                searchResults.map((item, index) => (
                  <button
                    className={`erp-search-result ${index === activeSearchIndex ? 'active' : ''}`}
                    id={`header-search-result-${index}`}
                    key={item.to}
                    type="button"
                    role="option"
                    aria-selected={index === activeSearchIndex}
                    onMouseEnter={() => setActiveSearchIndex(index)}
                    onClick={() => goToSearchResult(item)}
                  >
                    <span className="erp-search-result-icon">
                      <i className={`bi ${item.icon}`} />
                    </span>
                    <span className="erp-search-result-copy">
                      <span className="erp-search-result-title">{item.title}</span>
                      <span className="erp-search-result-subtitle">{item.subtitle}</span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="erp-search-empty">No pages found</div>
              )}
            </div>
          )}
        </form>

        {user && (
          <div className="dropdown">
            <button
              className="btn erp-profile-button dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <span className="erp-avatar"><i className="bi bi-person-fill" /></span>
              <span className="erp-profile-copy d-none d-sm-flex">
                <span className="erp-profile-name text-truncate">{user.username}</span>
                <span className="erp-profile-role text-truncate">{user.role}</span>
              </span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-sm">
              <li><h6 className="dropdown-header">{user.username}</h6></li>
              <li><span className="dropdown-item-text small text-muted">{user.role}</span></li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item text-danger" type="button" onClick={logout}>
                  <i className="bi bi-box-arrow-right me-2" />
                  Logout
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
