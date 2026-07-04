import { useEffect, useState } from 'react';
import FormModal from '../shared/FormModal.jsx';
import { customerPaymentApi } from '../../api/customerPaymentApi';
import { formatDate } from '../../utils/dateFormat';

export default function CustomerPaymentHistoryModal({ show, customer, onClose }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && customer) {
      loadPayments();
    }
  }, [show, customer]);

  async function loadPayments() {
    setLoading(true);
    try {
      const response = await customerPaymentApi.list({ customer_id: customer.customer_id });
      setPayments(response.data.data);
    } catch (err) {
      console.error('Error loading payment history:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormModal
      show={show}
      title={`Payment History - ${customer?.customer_name}`}
      onSubmit={onClose}
      onClose={onClose}
      busy={loading}
      submitLabel="Close"
    >
      {loading ? (
        <div className="text-center py-3">Loading...</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-3 text-muted">No payment history found</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Applied</th>
                <th>Type</th>
                <th>Source</th>
                <th>Order</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{formatDate(payment.payment_date)}</td>
                  <td>{Number(payment.amount).toLocaleString()}</td>
                  <td>{Number(payment.applied_amount).toLocaleString()}</td>
                  <td>{payment.payment_type}</td>
                  <td>
                    <span className={`badge ${payment.payment_source === 'CustomerPayment' ? 'bg-primary' : 'bg-info'}`}>
                      {payment.payment_source === 'CustomerPayment' ? 'Customer' : 'Order'}
                    </span>
                  </td>
                  <td>{payment.order_id_display || '-'}</td>
                  <td className="small">{payment.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </FormModal>
  );
}
