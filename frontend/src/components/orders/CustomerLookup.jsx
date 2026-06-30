export default function CustomerLookup({ customers, value, onChange }) {
  return (
    <div>
      <label className="form-label small">Customer</label>
      <select className="form-select form-select-sm" value={value} onChange={(event) => onChange(Number(event.target.value))} required>
        <option value="">Select customer</option>
        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>{customer.name} - {customer.mobile}</option>
        ))}
      </select>
    </div>
  );
}
