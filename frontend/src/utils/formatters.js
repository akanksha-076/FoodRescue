export const DONATION_CATEGORIES = [
  'Cooked Meals',
  'Bakery & Bread',
  'Fruits & Vegetables',
  'Dairy & Beverages',
  'Packaged Food',
  'Dry Grains & Staples',
  'Other',
];

export const DONATION_UNITS = ['servings', 'kg', 'boxes', 'packs', 'liters', 'trays'];

export const DONATION_STATUSES = [
  'Available',
  'Requested',
  'Approved',
  'Rejected',
  'Picked Up',
  'Completed',
  'Cancelled',
  'Expired',
];

export const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const toDateTimeLocalInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

export const formatTimeRemaining = (deadline) => {
  if (!deadline) return 'No deadline';
  const diffMs = new Date(deadline).getTime() - Date.now();
  if (diffMs <= 0) return 'Expired';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
};

export const getDashboardPathForRole = (role) => {
  if (role === 'donor') return '/donor/dashboard';
  if (role === 'ngo') return '/ngo/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/';
};
