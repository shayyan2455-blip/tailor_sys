export default function StatusBadge({ value }) {
  const map = {
    Open: 'text-bg-primary',
    Ready: 'text-bg-success',
    Delivered: 'text-bg-dark',
    Cancelled: 'text-bg-secondary',
    Booked: 'text-bg-secondary',
    Cutting: 'text-bg-info',
    Stitching: 'text-bg-warning',
    Trial: 'text-bg-primary',
    Alteration: 'text-bg-warning',
    Pressing: 'text-bg-info'
  };
  return <span className={`badge status-badge ${map[value] || 'text-bg-light'}`}>{value}</span>;
}
