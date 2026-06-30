import OrderItemRow from './OrderItemRow.jsx';

export const emptyItem = { garment_type: '', qty: 1, rate: 0, fabric_id: null, remarks: '' };

export default function OrderItemsGrid({ items, fabrics, onChange }) {
  function update(index, item) {
    onChange(items.map((row, rowIndex) => rowIndex === index ? item : row));
  }

  return (
    <div className="bg-white border rounded-2 overflow-hidden">
      <div className="d-flex align-items-center justify-content-between p-2 border-bottom">
        <h2 className="h6 mb-0">Garments</h2>
        <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => onChange([...items, { ...emptyItem }])}><i className="bi bi-plus-lg me-1" />Item</button>
      </div>
      <div className="table-responsive">
        <table className="table table-sm align-middle mb-0">
          <thead className="table-light">
            <tr><th>Garment</th><th style={{ width: 90 }}>Qty</th><th style={{ width: 130 }}>Rate</th><th style={{ width: 180 }}>Fabric</th><th>Remarks</th><th className="text-end">Amount</th><th /></tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <OrderItemRow key={index} item={item} fabrics={fabrics} onChange={(next) => update(index, next)} onRemove={() => onChange(items.filter((_, rowIndex) => rowIndex !== index))} canRemove={items.length > 1} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
