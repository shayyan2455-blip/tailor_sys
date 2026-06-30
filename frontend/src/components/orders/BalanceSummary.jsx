export default function BalanceSummary({ items, advance }) {
  const total = items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.rate || 0), 0);
  const balance = Math.max(0, total - Number(advance || 0));
  return (
    <div className="bg-white border rounded-2 p-2 d-flex flex-wrap gap-3 justify-content-end">
      <div><span className="text-muted small">Total</span><div className="fw-semibold">{total.toLocaleString()}</div></div>
      <div><span className="text-muted small">Advance</span><div className="fw-semibold">{Number(advance || 0).toLocaleString()}</div></div>
      <div><span className="text-muted small">Balance</span><div className="fw-semibold text-danger">{balance.toLocaleString()}</div></div>
    </div>
  );
}
