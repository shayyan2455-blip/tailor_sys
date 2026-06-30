const fields = ['neck', 'chest', 'waist', 'hip', 'shoulder', 'sleeve', 'length', 'collar', 'shalwar_len', 'pancha'];

export default function MeasurementForm({ value, onChange }) {
  return (
    <div className="bg-white border rounded-2 p-2">
      <h2 className="h6 mb-2">Measurements</h2>
      <div className="row g-2">
        {fields.map((field) => (
          <div className="col-6 col-md-3 col-xl-2" key={field}>
            <label className="form-label small text-capitalize">{field.replace('_', ' ')}</label>
            <input className="form-control form-control-sm" type="number" min="0" step="0.01" value={value[field] || ''} onChange={(event) => onChange({ ...value, [field]: event.target.value })} />
          </div>
        ))}
      </div>
    </div>
  );
}
