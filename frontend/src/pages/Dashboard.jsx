import { useEffect, useState } from 'react';
import { orderApi } from '../api/orderApi';
import { reportApi } from '../api/reportApi';

export default function Dashboard() {
  const [stats, setStats] = useState({ open: 0, ready: 0, recovery: 0 });
  const [financials, setFinancials] = useState({ 
    supplier_total_owed: 0, 
    supplier_paid: 0, 
    supplier_balance: 0,
    customer_total_owed: 0, 
    customer_paid: 0, 
    customer_balance_owed: 0,
    worker_total_owed: 0, 
    worker_paid: 0, 
    worker_balance: 0 
  });

  useEffect(() => {
    let alive = true;
    Promise.all([
      orderApi.list({ status: 'Open' }),
      reportApi.readyOrders(),
      reportApi.recovery(),
      reportApi.dashboardStats()
    ]).then(([open, ready, recovery, financialData]) => {
      if (!alive) return;
      setStats({
        open: open.data.data.length,
        ready: ready.data.data.length,
        recovery: recovery.data.data.reduce((sum, row) => sum + Number(row.balance || 0), 0)
      });
      setFinancials(financialData.data.data);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <div>
      <div className="page-toolbar d-flex align-items-center justify-content-between mb-2">
        <h1 className="h5 mb-0">Dashboard</h1>
      </div>
      <div className="row g-2 mb-2">
        <div className="col-md-4"><StatCard icon="bi-receipt" label="Open Orders" value={stats.open} /></div>
        <div className="col-md-4"><StatCard icon="bi-check2-square" label="Ready Orders" value={stats.ready} /></div>
        <div className="col-md-4"><StatCard icon="bi-cash-coin" label="Outstanding" value={stats.recovery.toLocaleString()} /></div>
      </div>
      <div className="row g-2 mb-2">
        <div className="col-md-4"><StatCard icon="bi-people" label="Customer Owed" value={financials.customer_total_owed.toLocaleString()} /></div>
        <div className="col-md-4"><StatCard icon="bi-cash" label="Customer Paid" value={financials.customer_paid.toLocaleString()} /></div>
        <div className="col-md-4"><StatCard icon="bi-bank" label="Customer Balance" value={financials.customer_balance_owed.toLocaleString()} /></div>
      </div>
      <div className="row g-2 mb-2">
        <div className="col-md-4"><StatCard icon="bi-wallet2" label="Supplier Owed" value={financials.supplier_total_owed.toLocaleString()} /></div>
        <div className="col-md-4"><StatCard icon="bi-cash-stack" label="Supplier Paid" value={financials.supplier_paid.toLocaleString()} /></div>
        <div className="col-md-4"><StatCard icon="bi-bank2" label="Supplier Balance" value={financials.supplier_balance.toLocaleString()} /></div>
      </div>
      <div className="row g-2">
        <div className="col-md-4"><StatCard icon="bi-person-badge" label="Worker Owed" value={financials.worker_total_owed.toLocaleString()} /></div>
        <div className="col-md-4"><StatCard icon="bi-cash-coin" label="Worker Paid" value={financials.worker_paid.toLocaleString()} /></div>
        <div className="col-md-4"><StatCard icon="bi-bank" label="Worker Balance" value={financials.worker_balance.toLocaleString()} /></div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white border rounded-2 p-3 d-flex align-items-center gap-3">
      <i className={`bi ${icon} fs-4 text-primary`} />
      <div>
        <div className="small text-muted">{label}</div>
        <div className="h4 mb-0">{value}</div>
      </div>
    </div>
  );
}
