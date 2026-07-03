// Dashboard page component
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { orderApi } from '../api/orderApi';
import { paymentApi } from '../api/paymentApi';
import { reportApi } from '../api/reportApi';
import { productionApi } from '../api/productionApi';

const DAY_MS = 24 * 60 * 60 * 1000;
const stageColors = ['#2f80ed', '#35c98f', '#ffad21', '#8954e9', '#22b8cf', '#64748b'];
const quickActions = [
  { label: 'New Order', icon: 'bi-clipboard-plus', to: '/orders/new', color: 'blue' },
  { label: 'Add Customer', icon: 'bi-people', to: '/customers?new=1', color: 'green' },
  { label: 'Add Fabric', icon: 'bi-layers', to: '/fabrics?new=1', color: 'purple' },
  { label: 'New Expense', icon: 'bi-receipt', to: '/expenses', color: 'orange' },
  { label: 'Create Invoice', icon: 'bi-file-earmark-text', to: '/billing', color: 'cyan' }
];

const emptyDashboard = {
  stats: {
    totalOrders: 0,
    productionOrders: 0,
    readyOrders: 0,
    revenue: 0,
    allOrdersCount: 0,
    allReadyOrdersCount: 0
  },
  trends: {
    totalOrders: 0,
    productionOrders: 0,
    readyOrders: 0,
    revenue: 0
  },
  ordersOverview: [],
  revenueOverview: [],
  productionStatus: [],
  recentOrders: [],
  duePayments: [],
  activityFeed: [],
  topItems: [],
  productionTotal: 0,
  totalDue: 0,
  allProductionOrders: []
};

function toNumber(value) {
  return Number(value || 0);
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toInputDate(date) {
  return date.toISOString().slice(0, 10);
}

function money(value) {
  return `Rs. ${Math.round(toNumber(value)).toLocaleString()}`;
}

function shortMoney(value) {
  const amount = toNumber(value);
  if (Math.abs(amount) >= 1000000) return `${Math.round(amount / 10000) / 100}M`;
  if (Math.abs(amount) >= 1000) return `${Math.round(amount / 100) / 10}K`;
  return String(Math.round(amount));
}

function percentChange(current, previous) {
  if (previous === 0 || previous === null || previous === undefined) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

function periodRange(period) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let start;
  if (period === 'last30') {
    start = new Date(today);
    start.setDate(today.getDate() - 29);
  } else if (period === 'year') {
    start = new Date(today.getFullYear(), 0, 1);
  } else {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  const end = new Date(today);
  const days = Math.max(1, Math.round((end - start) / DAY_MS) + 1);
  const previousEnd = new Date(start);
  previousEnd.setDate(start.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousEnd.getDate() - days + 1);

  return { start, end, previousStart, previousEnd };
}

function inRange(value, start, end) {
  const date = toDate(value);
  if (!date) return false;
  date.setHours(0, 0, 0, 0);
  return date >= start && date <= end;
}

function formatBucketLabel(date) {
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function makeBuckets(start, end) {
  const days = Math.max(1, Math.round((end - start) / DAY_MS) + 1);
  const count = Math.min(6, Math.max(4, Math.ceil(days / 7)));
  const bucketSize = Math.max(1, Math.ceil(days / count));

  return Array.from({ length: count }, (_, index) => {
    const bucketStart = new Date(start);
    bucketStart.setDate(start.getDate() + index * bucketSize);
    return {
      start: bucketStart,
      label: formatBucketLabel(bucketStart),
      newOrders: 0,
      completedOrders: 0,
      revenue: 0
    };
  });
}

function bucketIndex(dateValue, start, bucketCount, bucketSize) {
  const date = toDate(dateValue);
  if (!date) return -1;
  date.setHours(0, 0, 0, 0);
  const index = Math.floor((date - start) / DAY_MS / bucketSize);
  return Math.min(Math.max(index, 0), bucketCount - 1);
}

function buildSeries(orders, payments, start, end) {
  const buckets = makeBuckets(start, end);
  const bucketSize = Math.max(1, Math.ceil((Math.round((end - start) / DAY_MS) + 1) / buckets.length));

  orders.forEach((order) => {
    const index = bucketIndex(order.order_date, start, buckets.length, bucketSize);
    if (index < 0) return;
    buckets[index].newOrders += 1;
    if (order.status === 'Delivered') buckets[index].completedOrders += 1;
  });

  payments.forEach((payment) => {
    const index = bucketIndex(payment.payment_date, start, buckets.length, bucketSize);
    if (index < 0) return;
    buckets[index].revenue += toNumber(payment.amount);
  });

  return buckets;
}

function statusClass(value) {
  if (value === 'Delivered') return 'success';
  if (value === 'Ready') return 'warning';
  if (value === 'Open') return 'primary';
  return 'secondary';
}

function stageLabel(value) {
  return value || 'Booked';
}

function timeAgo(value) {
  const date = toDate(value);
  if (!date) return '';
  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes || 1} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function calculateTopItems(orderDetails) {
  const groups = new Map();

  orderDetails.forEach((detail) => {
    detail?.items?.forEach((item) => {
      const name = item.garment_type || 'Other';
      const qty = toNumber(item.qty);
      const amount = qty * toNumber(item.rate);
      const current = groups.get(name) || { name, qty: 0, amount: 0 };
      current.qty += qty;
      current.amount += amount;
      groups.set(name, current);
    });
  });

  const rows = Array.from(groups.values()).sort((a, b) => b.amount - a.amount);
  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);
  return rows.slice(0, 5).map((row) => ({
    ...row,
    percent: totalAmount ? Math.round((row.amount / totalAmount) * 100) : 0
  }));
}

function buildActivityFeed(orders, readyOrders, payments) {
  const orderById = new Map(orders.map((order) => [Number(order.id), order]));
  const activities = [
    ...orders.slice(0, 4).map((order) => ({
      key: `order-${order.id}`,
      icon: 'bi-clipboard-plus',
      color: 'blue',
      title: `New order ORD-${order.id} created`,
      meta: order.customer_name,
      date: order.order_date
    })),
    ...readyOrders.slice(0, 3).map((order) => ({
      key: `ready-${order.id}`,
      icon: 'bi-truck',
      color: 'orange',
      title: `Order ORD-${order.id} is ready for delivery`,
      meta: order.customer_name,
      date: order.delivery_date || order.order_date
    })),
    ...payments.slice(0, 4).map((payment) => {
      const order = orderById.get(Number(payment.order_id));
      return {
        key: `payment-${payment.id}`,
        icon: 'bi-cash-coin',
        color: 'green',
        title: `Payment received for ORD-${payment.order_id}`,
        meta: `${money(payment.amount)}${order?.customer_name ? ` from ${order.customer_name}` : ''}`,
        date: payment.payment_date
      };
    })
  ];

  return activities
    .sort((a, b) => (toDate(b.date)?.getTime() || 0) - (toDate(a.date)?.getTime() || 0))
    .slice(0, 5);
}

export default function Dashboard() {
  const [period, setPeriod] = useState('month');
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const range = useMemo(() => periodRange(period), [period]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const params = { from: toInputDate(range.start), to: toInputDate(range.end) };
        const previousParams = { from: toInputDate(range.previousStart), to: toInputDate(range.previousEnd) };
        const [
          ordersResponse,
          previousOrdersResponse,
          readyResponse,
          previousReadyResponse,
          recoveryResponse,
          financialResponse,
          paymentsResponse,
          allOrdersResponse,
          previousAllOrdersResponse,
          productionResponse
        ] = await Promise.all([
          orderApi.list(params),
          orderApi.list(previousParams),
          reportApi.readyOrders(params),
          reportApi.readyOrders(previousParams),
          reportApi.recovery(params),
          reportApi.dashboardStats(),
          paymentApi.list(),
          orderApi.list(),
          orderApi.list(previousParams),
          productionApi.active()
        ]);

        if (!alive) return;

        const orders = ordersResponse.data.data || [];
        const previousOrders = previousOrdersResponse.data.data || [];
        const readyOrders = readyResponse.data.data || [];
        const previousReadyOrders = previousReadyResponse.data.data || [];
        const duePayments = recoveryResponse.data.data || [];
        const financials = financialResponse.data.data || {};
        const allPayments = paymentsResponse.data.data || [];
        const allOrders = allOrdersResponse.data.data || [];
        const previousAllOrders = previousAllOrdersResponse.data.data || [];
        const allProductionOrders = productionResponse.data.data || [];
        const allReadyOrders = allOrders.filter((order) => order.current_stage === 'Ready' || (order.status === 'Delivered' && !order.delivery_date));
        const previousAllReadyOrders = previousAllOrders.filter((order) => order.current_stage === 'Ready' || (order.status === 'Delivered' && !order.delivery_date));
        const payments = allPayments.filter((payment) => inRange(payment.payment_date, range.start, range.end));
        const previousPayments = allPayments.filter((payment) => inRange(payment.payment_date, range.previousStart, range.previousEnd));

        const orderDetails = await Promise.all(
          orders.map((order) => orderApi.detail(order.id).then((response) => response.data.data).catch(() => null))
        );

        if (!alive) return;

        const activeProduction = allProductionOrders.filter((order) => order.status !== 'Delivered' && order.current_stage !== 'Ready');
        const previousProduction = previousOrders.filter((order) => order.status !== 'Delivered' && order.current_stage !== 'Ready');
        const revenue = payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
        const previousRevenue = previousPayments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
        const productionGroups = allProductionOrders.reduce((groups, order) => {
          const label = stageLabel(order.current_stage);
          groups.set(label, (groups.get(label) || 0) + 1);
          return groups;
        }, new Map());
        const series = buildSeries(orders, payments, range.start, range.end);

        setDashboard({
          stats: {
            totalOrders: orders.length,
            productionOrders: activeProduction.length,
            readyOrders: readyOrders.length,
            revenue,
            allOrdersCount: allOrders.length,
            allReadyOrdersCount: allReadyOrders.length
          },
          trends: {
            totalOrders: percentChange(allOrders.length, previousAllOrders.length),
            productionOrders: percentChange(activeProduction.length, previousProduction.length),
            readyOrders: percentChange(allReadyOrders.length, previousAllReadyOrders.length),
            revenue: percentChange(revenue, previousRevenue)
          },
          ordersOverview: series,
          revenueOverview: series,
          productionStatus: Array.from(productionGroups.entries()).map(([name, value], index) => ({
            name,
            value,
            color: stageColors[index % stageColors.length]
          })),
          recentOrders: orders.slice(0, 5),
          duePayments: duePayments.slice(0, 5),
          activityFeed: buildActivityFeed(orders, readyOrders, payments),
          topItems: calculateTopItems(orderDetails),
          productionTotal: allProductionOrders.length,
          totalDue: duePayments.reduce((sum, row) => sum + toNumber(row.balance), 0),
          financials,
          allProductionOrders
        });
      } catch (err) {
        if (alive) setError(err?.error?.message || 'Unable to load dashboard data');
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => { alive = false; };
  }, [range]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-toolbar">
        <div>
          <div className="dashboard-kicker">Business Snapshot</div>
          <div className="dashboard-period-label">{toInputDate(range.start)} to {toInputDate(range.end)}</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          {loading && <span className="small text-muted">Refreshing...</span>}
          <select className="form-select form-select-sm dashboard-period-select" value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="month">This Month</option>
            <option value="last30">Last 30 Days</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="dashboard-stat-grid">
        <StatCard icon="bi-bag-check" label="Total Orders" value={dashboard.stats.allOrdersCount} trend={dashboard.trends.totalOrders} color="blue" />
        <StatCard icon="bi-clipboard-data" label="In Production" value={dashboard.stats.productionOrders} trend={dashboard.trends.productionOrders} color="green" />
        <StatCard icon="bi-truck" label="Ready to Deliver" value={dashboard.stats.allReadyOrdersCount} trend={dashboard.trends.readyOrders} color="orange" />
        <StatCard icon="bi-currency-exchange" label="Total Revenue" value={money(dashboard.stats.revenue)} trend={dashboard.trends.revenue} color="purple" />
      </div>

      <div className="dashboard-main-grid">
        <DashboardPanel title="Orders Overview" action={<span className="dashboard-chip">This period</span>} className="orders-panel">
          <div className="dashboard-legend">
            <span><i className="legend-dot blue" />New Orders</span>
            <span><i className="legend-dot green" />Completed Orders</span>
          </div>
          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard.ordersOverview} margin={{ top: 10, right: 8, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="newOrdersFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2f80ed" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#2f80ed" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="completedOrdersFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#35c98f" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#35c98f" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#667085' }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#667085' }} />
                <Tooltip formatter={(value) => [value, 'Orders']} />
                <Area type="monotone" dataKey="newOrders" stroke="#2f80ed" strokeWidth={3} fill="url(#newOrdersFill)" />
                <Area type="monotone" dataKey="completedOrders" stroke="#35c98f" strokeWidth={3} fill="url(#completedOrdersFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Recent Orders" action={<Link to="/billing">View All</Link>}>
          <div className="dashboard-list">
            {dashboard.recentOrders.map((order) => (
              <Link className="dashboard-list-row" to={`/orders/${order.id}`} key={order.id}>
                <span className="dashboard-row-icon"><i className="bi bi-clipboard" /></span>
                <span className="dashboard-row-copy">
                  <strong>ORD-{order.id}</strong>
                  <small>{order.customer_name}</small>
                </span>
                <span className={`dashboard-status ${statusClass(order.current_stage === 'Ready' ? 'Ready' : order.status)}`}>
                  {order.current_stage === 'Ready' ? 'Ready' : order.status}
                </span>
                <i className="bi bi-chevron-right dashboard-row-arrow" />
              </Link>
            ))}
            {!dashboard.recentOrders.length && <EmptyState label="No orders in this period" />}
          </div>
        </DashboardPanel>
      </div>

      <div className="dashboard-secondary-grid">
        <DashboardPanel title="Production Status">
          <div className="production-panel-body">
            <div className="production-chart-wrap">
              <ResponsiveContainer width="100%" height={178}>
                <PieChart>
                  <Pie
                    data={dashboard.productionStatus}
                    cx="50%"
                    cy="50%"
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={78}
                    paddingAngle={2}
                  >
                    {dashboard.productionStatus.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="production-total">
                <strong>{dashboard.productionTotal}</strong>
                <span>Total</span>
              </div>
            </div>
            <div className="production-legend">
              {dashboard.productionStatus.map((stage) => (
                <div className="production-legend-row" key={stage.name}>
                  <span><i style={{ background: stage.color }} />{stage.name}</span>
                  <strong>{stage.value}</strong>
                </div>
              ))}
              {!dashboard.productionStatus.length && <EmptyState label="No active production" />}
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Revenue Overview" action={<span className="dashboard-chip">This period</span>}>
          <div className="dashboard-panel-metric">
            <strong>{money(dashboard.stats.revenue)}</strong>
            <Trend value={dashboard.trends.revenue} />
          </div>
          <div className="dashboard-chart revenue-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.revenueOverview} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#667085' }} />
                <YAxis tickFormatter={shortMoney} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#667085' }} />
                <Tooltip formatter={(value) => [money(value), 'Revenue']} />
                <Bar dataKey="revenue" fill="#2f80ed" radius={[5, 5, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Top Selling Items" action={<span className="dashboard-chip">This period</span>}>
          <div className="top-items-list">
            {dashboard.topItems.map((item, index) => (
              <div className="top-item-row" key={item.name}>
                <span className="top-item-icon"><i className={`bi ${index === 0 ? 'bi-person-standing' : 'bi-layers'}`} /></span>
                <span className="dashboard-row-copy">
                  <strong>{item.name}</strong>
                  <small>{money(item.amount)}</small>
                </span>
                <span className="top-item-percent">{item.percent}%</span>
              </div>
            ))}
            {!dashboard.topItems.length && <EmptyState label="No sold items in this period" />}
          </div>
        </DashboardPanel>
      </div>

      <div className="dashboard-bottom-grid">
        <DashboardPanel title="Due Payments" action={<Link to="/reports/recovery">View All</Link>}>
          <div className="dashboard-list compact">
            {dashboard.duePayments.map((row) => (
              <Link className="dashboard-list-row" to={`/orders/${row.id}`} key={row.id}>
                <span className="dashboard-row-icon"><i className="bi bi-person" /></span>
                <span className="dashboard-row-copy">
                  <strong>{row.customer_name}</strong>
                  <small>Order ORD-{row.id}</small>
                </span>
                <span className="due-amount">{money(row.balance)}</span>
              </Link>
            ))}
            {!dashboard.duePayments.length && <EmptyState label="No due payments" />}
            <div className="dashboard-total-row">
              <span>Total Due</span>
              <strong>{money(dashboard.totalDue)}</strong>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Activity Feed" action={<Link to="/billing">View All</Link>}>
          <div className="activity-list">
            {dashboard.activityFeed.map((activity) => (
              <div className="activity-row" key={activity.key}>
                <span className={`activity-icon ${activity.color}`}><i className={`bi ${activity.icon}`} /></span>
                <span className="dashboard-row-copy">
                  <strong>{activity.title}</strong>
                  <small>{activity.meta}</small>
                </span>
                <span className="activity-time">{timeAgo(activity.date)}</span>
              </div>
            ))}
            {!dashboard.activityFeed.length && <EmptyState label="No recent activity" />}
          </div>
        </DashboardPanel>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          {quickActions.map((action) => (
            <Link className={`quick-action ${action.color}`} to={action.to} key={action.label}>
              <i className={`bi ${action.icon}`} />
              <span>{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend, color }) {
  return (
    <div className="dashboard-stat-card">
      <span className={`dashboard-stat-icon ${color}`}><i className={`bi ${icon}`} /></span>
      <div className="dashboard-stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <Trend value={trend} label="vs previous period" />
      </div>
    </div>
  );
}

function Trend({ value, label = 'vs previous period' }) {
  if (value === null || value === undefined || isNaN(value)) {
    return null;
  }
  const isPositive = value >= 0;
  return (
    <span className={`dashboard-trend ${isPositive ? 'positive' : 'negative'}`}>
      <i className={`bi ${isPositive ? 'bi-arrow-up' : 'bi-arrow-down'}`} />
      {Math.abs(value).toFixed(1)}%
      <em>{label}</em>
    </span>
  );
}

function DashboardPanel({ title, action, className = '', children }) {
  return (
    <section className={`dashboard-panel ${className}`}>
      <div className="dashboard-panel-header">
        <h2>{title}</h2>
        {action && <div className="dashboard-panel-action">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ label }) {
  return <div className="dashboard-empty">{label}</div>;
}
