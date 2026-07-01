import './invoice.css';

export default function InvoiceSlip({ order, items = [], payments = [] }) {
  const paid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  return (
    <section className="invoice-slip bg-white border rounded-2 p-3">
      <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
        <div>
          <h2 className="h5 mb-0">Tailor ERP</h2>
          <div className="small text-muted">Invoice Slip</div>
        </div>
        <div className="text-end small">
          <div><strong>Order:</strong> #{order?.id}</div>
          <div><strong>Date:</strong> {order?.order_date}</div>
        </div>
      </div>
      <div className="small mb-2">
        <strong>Customer:</strong> {order?.customer_name} &nbsp; <strong>Mobile:</strong> {order?.mobile}
      </div>
      <table className="table table-sm">
        <thead><tr><th>Garment</th><th>Qty</th><th>Rate</th><th className="text-end">Amount</th></tr></thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}><td>{item.garment_type}</td><td>{item.qty}</td><td>{item.rate}</td><td className="text-end">{Number(item.amount).toLocaleString()}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="text-end small">
        <div><strong>Total:</strong> {Number(order?.total_amount || 0).toLocaleString()}</div>
        <div><strong>Paid:</strong> {paid.toLocaleString()}</div>
        <div><strong>Balance:</strong> {Number(order?.balance || 0).toLocaleString()}</div>
      </div>
    </section>
  );
}
