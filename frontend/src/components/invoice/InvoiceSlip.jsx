import './invoice.css';

export default function InvoiceSlip({ order, items = [], payments = [], measurements = null }) {
  const paid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const measurementLabels = {
    neck: 'Neck',
    chest: 'Chest',
    waist: 'Waist',
    hip: 'Hip',
    shoulder: 'Shoulder',
    sleeve: 'Sleeve',
    length: 'Length',
    collar: 'Collar',
    shalwar_len: 'Shalwar Length',
    pancha: 'Pancha'
  };

  const measurementFields = Object.keys(measurementLabels);

  return (
    <section className="invoice-slip bg-white border rounded-2 p-5">
      <div className="d-flex justify-content-between border-bottom pb-3 mb-4">
        <div>
          <h2 className="h5 mb-0">Tailor ERP</h2>
          <div className="text-muted">Invoice Slip</div>
        </div>
        <div className="text-end">
          <div><strong>Order: </strong> #{order?.id}</div>
          <div><strong>Date: </strong> {order?.order_date}</div>
        </div>
      </div>
      <div className="row mb-4">
        <div className="col-6">
          <div><strong>Customer: </strong></div>
          <div className="mt-3"><strong>Mobile: </strong></div>
          <div className="mt-3"><strong>Address: </strong></div>
          <div className="mt-3"><strong>Advance: </strong></div>
        </div>
        <div className="col-6 text-end">
          <div>{order?.customer_name}</div>
          <div className="mt-3">{order?.mobile}</div>
          <div className="mt-3">{order?.address || '-'}</div>
          <div className="mt-3">{Number(order?.advance || 0).toLocaleString()}</div>
        </div>
      </div>
      {measurements && (
        <div className="mb-4">
          <h3 className="h6 mb-3">Measurements</h3>
          <div className="row">
            {measurementFields.map((field) => (
              <div className="col-6 mb-2" key={field}>
                <strong>{measurementLabels[field]}: </strong>
                <span>{measurements[field] ?? '-'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <table className="table">
        <thead><tr><th>Garment</th><th className="text-center">Qty</th><th className="text-end">Rate</th><th className="text-end">Amount</th></tr></thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}><td>{item.garment_type}</td><td className="text-center">{item.qty}</td><td className="text-end">{Number(item.rate).toLocaleString()}</td><td className="text-end">{Number(item.amount).toLocaleString()}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="row mt-4">
        <div className="col-6">
          <div><strong>Total: </strong></div>
          <div className="mt-3"><strong>Balance: </strong></div>
        </div>
        <div className="col-6 text-end">
          <div>{Number(order?.total_amount || 0).toLocaleString()}</div>
          <div className="mt-3">{Number(order?.balance || 0).toLocaleString()}</div>
        </div>
      </div>
    </section>
  );
}
