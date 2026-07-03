import './invoice.css';

export default function InvoiceSlip({ order, items = [], payments = [] }) {
  const paid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  return (
    <section className="invoice-slip bg-white border rounded-2 p-3">
      <div className="d-flex justify-content-between border-bottom pb-2 mb-3">
        <div>
          <h2 className="h5 mb-0">Tailor ERP</h2>
          <div className="text-muted">Invoice Slip</div>
        </div>
        <div className="text-end">
          <div><strong>Order:</strong> #{order?.id}</div>
          <div><strong>Date:</strong> {order?.order_date}</div>
        </div>
      </div>
      <div className="row mb-3">
        <div className="col-6">
          <div><strong>Customer:</strong></div>
          <div className="mt-2"><strong>Mobile:</strong></div>
          <div className="mt-2"><strong>Address:</strong></div>
          <div className="mt-2"><strong>Advance:</strong></div>
        </div>
        <div className="col-6 text-end">
          <div>{order?.customer_name}</div>
          <div className="mt-2">{order?.mobile}</div>
          <div className="mt-2">{order?.address || '-'}</div>
          <div className="mt-2">{Number(order?.advance || 0).toLocaleString()}</div>
        </div>
      </div>
      <table className="table">
        <thead><tr><th>Garment</th><th className="text-center">Qty</th><th className="text-end">Rate</th><th className="text-end">Amount</th></tr></thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}><td>{item.garment_type}</td><td className="text-center">{item.qty}</td><td className="text-end">{Number(item.rate).toLocaleString()}</td><td className="text-end">{Number(item.amount).toLocaleString()}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="row mt-3">
        <div className="col-6">
          <div><strong>Total:</strong></div>
          <div className="mt-2"><strong>Balance:</strong></div>
        </div>
        <div className="col-6 text-end">
          <div>{Number(order?.total_amount || 0).toLocaleString()}</div>
          <div className="mt-2">{Number(order?.balance || 0).toLocaleString()}</div>
        </div>
      </div>
    </section>
  );
}
