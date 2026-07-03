import { useEffect, useState } from 'react';
import { productionApi } from '../../api/productionApi';
import FormModal from '../shared/FormModal.jsx';
import { formatDate } from '../../utils/dateFormat';

export default function OrderTrackingModal({ show, order, onClose }) {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && order) {
      loadTracking();
    }
  }, [show, order]);

  async function loadTracking() {
    setLoading(true);
    try {
      const response = await productionApi.tracking(order.id);
      setTracking(response.data.data);
    } catch (err) {
      console.error('Error loading tracking:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormModal 
      show={show} 
      title={`Order #${order?.id} - Stage Tracking`}
      onSubmit={() => onClose()}
      onClose={onClose}
      busy={loading}
      showSubmit={false}
    >
      {loading ? (
        <p className="text-center text-muted">Loading tracking information...</p>
      ) : tracking ? (
        <div className="table-responsive">
          <table className="table table-sm table-bordered">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Status</th>
                <th>Completed At</th>
                <th>Worker</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {tracking.tracking.map((item) => {
                const isCurrent = item.stage === tracking.current_stage;
                return (
                  <tr key={item.stage} style={isCurrent ? { backgroundColor: '#e3f2fd' } : {}}>
                    <td style={isCurrent ? { fontWeight: 'bold' } : {}}>{item.stage}</td>
                    <td>{item.completed ? <span className="badge bg-success">Completed</span> : <span className="badge bg-secondary">Pending</span>}</td>
                    <td>{item.completed_at ? formatDate(item.completed_at) : '-'}</td>
                    <td>{item.worker_name || '-'}</td>
                    <td>{item.amount ? `Rs. ${item.amount}` : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-muted">No tracking data available</p>
      )}
    </FormModal>
  );
}
