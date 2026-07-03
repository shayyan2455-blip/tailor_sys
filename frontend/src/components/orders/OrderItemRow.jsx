export default function OrderItemRow({ item, fabrics, onChange, onRemove, canRemove }) {
  return (
    <tr>
      <td><input className="form-control form-control-sm" value={item.garment_type} onChange={(event) => onChange({ ...item, garment_type: event.target.value })} required /></td>
      <td><input className="form-control form-control-sm" type="number" min="1" value={item.qty || ''} onChange={(event) => onChange({ ...item, qty: Number(event.target.value) })} required /></td>
      <td><input className="form-control form-control-sm" type="number" min="0" step="0.01" value={item.rate || ''} onChange={(event) => onChange({ ...item, rate: Number(event.target.value) })} required /></td>
      <td>
        <select className="form-select form-select-sm" value={item.fabric_id || ''} onChange={(event) => onChange({ ...item, fabric_id: event.target.value ? Number(event.target.value) : null })}>
          <option value="">None</option>
          {fabrics.map((fabric) => <option key={fabric.id} value={fabric.id}>{fabric.name}</option>)}
        </select>
      </td>
      <td><input className="form-control form-control-sm" value={item.remarks || ''} onChange={(event) => onChange({ ...item, remarks: event.target.value })} /></td>
      <td className="text-end">{(Number(item.qty || 0) * Number(item.rate || 0)).toLocaleString()}</td>
      <td className="text-end">
        <button className="btn btn-sm btn-outline-danger icon-btn" type="button" onClick={onRemove} disabled={!canRemove} title="Remove row"><i className="bi bi-trash" /></button>
      </td>
    </tr>
  );
}
