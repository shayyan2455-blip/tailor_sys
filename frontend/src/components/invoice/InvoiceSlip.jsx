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
      <div className="row mb-2">
        <div className="col-6 small">
          <div><strong>Customer:</strong></div>
          <div>{order?.customer_name}</div>
        </div>
        <div className="col-6 small text-end">
          <div><strong>Mobile:</strong></div>
          <div>{order?.mobile}</div>
        </div>
      </div>
      <table className="table table-sm">
        <thead><tr><th>Garment</th><th className="text-center">Qty</th><th className="text-end">Rate</th><th className="text-end">Amount</th></tr></thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}><td>{item.garment_type}</td><td className="text-center">{item.qty}</td><td className="text-end">{Number(item.rate).toLocaleString()}</td><td className="text-end">{Number(item.amount).toLocaleString()}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="row mt-2">
        <div className="col-6 small">
          <div><strong>Total:</strong></div>
          <div><strong>Paid:</strong></div>
          <div><strong>Balance:</strong></div>
        </div>
        <div className="col-6 small text-end">
          <div>{Number(order?.total_amount || 0).toLocaleString()}</div>
          <div>{paid.toLocaleString()}</div>
          <div>{Number(order?.balance || 0).toLocaleString()}</div>
        </div>
      </div>
    </section>
  );
}
