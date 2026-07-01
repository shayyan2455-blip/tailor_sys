export default function ReportFilters({ filters, onChange, onRun, children }) {
  return (
    <form className="bg-white border rounded-2 p-2 mb-2" onSubmit={(event) => { event.preventDefault(); onRun(); }}>
      <div className="row g-2 align-items-end">
        <div className="col-md-3">
          <label className="form-label small">From</label>
          <input className="form-control form-control-sm" type="date" value={filters.from || ''} onChange={(event) => onChange({ ...filters, from: event.target.value })} />
        </div>
        <div className="col-md-3">
          <label className="form-label small">To</label>
          <input className="form-control form-control-sm" type="date" value={filters.to || ''} onChange={(event) => onChange({ ...filters, to: event.target.value })} />
        </div>
        {children}
        <div className="col-md-2">
          <button className="btn btn-sm btn-primary w-100" type="submit"><i className="bi bi-funnel me-1" />Run</button>
        </div>
      </div>
    </form>
  );
}
