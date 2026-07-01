export default function FormModal({ show, title, children, onSubmit, onClose, busy, error, submitLabel = 'Save' }) {
  if (!show) return null;

  return (
    <div className="modal d-block show" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered" style={{ zIndex: 1050 }}>
        <form className="modal-content" onSubmit={onSubmit}>
          <div className="modal-header py-2">
            <h5 className="modal-title fs-6">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            {children}
          </div>
          <div className="modal-footer py-2">
            <button className="btn btn-sm btn-outline-secondary" type="button" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="btn btn-sm btn-primary" type="submit" disabled={busy}>{submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
