const STATUS_CLASS_MAP = {
  Available: 'status-available',
  Requested: 'status-requested',
  Approved: 'status-approved',
  'Picked Up': 'status-picked-up',
  Completed: 'status-completed',
  Rejected: 'status-rejected',
  Cancelled: 'status-cancelled',
  Expired: 'status-expired',
};

const StatusBadge = ({ status }) => {
  const cls = STATUS_CLASS_MAP[status] || 'status-cancelled';
  return <span className={`status-badge ${cls}`}>{status}</span>;
};

export default StatusBadge;
