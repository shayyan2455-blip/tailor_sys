export default function ConfirmModal({ show, title, message, confirmLabel = 'Confirm', onConfirm, onClose, busy }) {
  if (!show) return null;

  return (
    <div className="modal d-block show" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1050 }}>
        <div className="modal-content">
          <div className="modal-header py-2">
            <h5 className="modal-title fs-6">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body py-3">{message}</div>
          <div className="modal-footer py-2">
            <button className="btn btn-sm btn-outline-secondary" type="button" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="btn btn-sm btn-danger" type="button" onClick={onConfirm} disabled={busy}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
