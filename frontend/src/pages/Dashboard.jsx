import { useEffect, useState } from 'react';
import { orderApi } from '../api/orderApi';
import { reportApi } from '../api/reportApi';

export default function Dashboard() {
  const [stats, setStats] = useState({ open: 0, ready: 0, recovery: 0 });

  useEffect(() => {
    let alive = true;
    Promise.all([
      orderApi.list({ status: 'Open' }),
      reportApi.readyOrders(),
      reportApi.recovery()
    ]).then(([open, ready, recovery]) => {
      if (!alive) return;
      setStats({
        open: open.data.length,
        ready: ready.data.length,
        recovery: recovery.data.reduce((sum, row) => sum + Number(row.balance || 0), 0)
      });
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <div>
      <div className="page-toolbar d-flex align-items-center justify-content-between mb-2">
        <h1 className="h5 mb-0">Dashboard</h1>
      </div>
      <div className="row g-2">
        <div className="col-md-4"><StatCard icon="bi-receipt" label="Open Orders" value={stats.open} /></div>
        <div className="col-md-4"><StatCard icon="bi-check2-square" label="Ready Orders" value={stats.ready} /></div>
        <div className="col-md-4"><StatCard icon="bi-cash-coin" label="Outstanding" value={stats.recovery.toLocaleString()} /></div>
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
