import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ClipboardList,
  History,
  UserCircle,
  Truck,
  CheckCircle,
  XCircle,
  Star,
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import DonationCard from '../components/DonationCard';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ReviewModal from '../components/ReviewModal';
import ProfileSection from '../components/ProfileSection';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { extractErrorMessage } from '../services/api';
import { DONATION_CATEGORIES, formatDateTime } from '../utils/formatters';

const NAV_ITEMS = [
  { id: 'browse', label: 'Available Donations', icon: Search },
  { id: 'requests', label: 'My Requests', icon: ClipboardList },
  { id: 'history', label: 'Donation History', icon: History },
  { id: 'profile', label: 'Profile Settings', icon: UserCircle },
];

const NgoDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('browse');
  const [donations, setDonations] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState(null);

  const [filters, setFilters] = useState({
    q: '',
    category: 'All',
    location: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: 'Open', limit: '18' });
      if (filters.q.trim()) params.set('q', filters.q.trim());
      if (filters.category !== 'All') params.set('category', filters.category);
      if (filters.location.trim()) params.set('location', filters.location.trim());

      const [donRes, reqRes] = await Promise.all([
        api.get(`/donations?${params.toString()}`),
        api.get('/requests/my'),
      ]);
      setDonations(donRes.data.data.donations || []);
      setMyRequests(reqRes.data.data.requests || []);
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRequestAction = async (requestId, action, msg) => {
    try {
      await api.patch(`/requests/${requestId}/${action}`);
      showToast(msg);
      loadData();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const activeRequests = myRequests.filter((r) =>
    ['Requested', 'Approved', 'Picked Up'].includes(r.status)
  );
  const historyRequests = myRequests.filter((r) =>
    ['Completed', 'Rejected', 'Cancelled', 'Expired'].includes(r.status)
  );

  return (
    <DashboardLayout navItems={NAV_ITEMS} activeTab={activeTab} onTabChange={setActiveTab}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.65rem' }}>
          Welcome, {user?.organizationName || user?.name}
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Discover available surplus food nearby, track request approvals, and confirm pickups.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Available Listings</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--forest)' }}>
              {donations.length}
            </div>
          </div>
          <div className="kpi-icon">
            <Search size={20} />
          </div>
        </div>
        <div className="kpi-card">
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Active Requests</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--orange)' }}>
              {activeRequests.length}
            </div>
          </div>
          <div className="kpi-icon" style={{ background: '#fff4ed', color: 'var(--orange)' }}>
            <ClipboardList size={20} />
          </div>
        </div>
        <div className="kpi-card">
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Approved Pickups</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>
              {myRequests.filter((r) => r.status === 'Approved').length}
            </div>
          </div>
          <div className="kpi-icon">
            <Truck size={20} />
          </div>
        </div>
        <div className="kpi-card">
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Completed</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#166534' }}>
              {myRequests.filter((r) => r.status === 'Completed').length}
            </div>
          </div>
          <div className="kpi-icon">
            <CheckCircle size={20} />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading NGO workspace..." />
      ) : (
        <>
          {activeTab === 'browse' && (
            <div>
              <div className="card card-body" style={{ marginBottom: 20 }}>
                <div className="grid-3" style={{ gap: 14 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Search Food</label>
                    <input
                      className="form-control"
                      placeholder="Keyword..."
                      value={filters.q}
                      onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Category</label>
                    <select
                      className="form-control"
                      value={filters.category}
                      onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
                    >
                      <option value="All">All Categories</option>
                      {DONATION_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Location</label>
                    <input
                      className="form-control"
                      placeholder="Neighborhood or city..."
                      value={filters.location}
                      onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {donations.length === 0 ? (
                <EmptyState
                  title="No available food listings match your filters"
                  description="Try clearing your search filters or check back shortly."
                />
              ) : (
                <div className="grid-3">
                  {donations.map((d) => (
                    <DonationCard key={d._id} donation={d} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              <h2 style={{ fontSize: '1.2rem', marginBottom: 14 }}>My Submitted Requests</h2>
              {myRequests.length === 0 ? (
                <EmptyState
                  title="No requests submitted yet"
                  description="Browse available surplus food and submit a pickup request."
                  action={
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setActiveTab('browse')}
                    >
                      Browse Donations
                    </button>
                  }
                />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Food Item</th>
                        <th>Donor</th>
                        <th>Requested Qty</th>
                        <th>Pickup Deadline</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myRequests.map((req) => {
                        const don = req.donationId || {};
                        const donor = don.donorId || {};
                        return (
                          <tr key={req._id}>
                            <td>
                              {don._id ? (
                                <Link
                                  to={`/donations/${don._id}`}
                                  style={{ fontWeight: 700, color: 'var(--forest)' }}
                                >
                                  {don.foodName}
                                </Link>
                              ) : (
                                'Listing removed'
                              )}
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {don.pickupLocation}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>
                                {donor.organizationName || donor.name}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {donor.phone}
                              </div>
                            </td>
                            <td>
                              <strong>
                                {req.requestedQuantity} {don.unit}
                              </strong>
                            </td>
                            <td>{formatDateTime(don.pickupDeadline)}</td>
                            <td>
                              <StatusBadge status={req.status} />
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {['Requested', 'Approved'].includes(req.status) && (
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() =>
                                      handleRequestAction(req._id, 'cancel', 'Request cancelled.')
                                    }
                                  >
                                    <XCircle size={14} /> Cancel
                                  </button>
                                )}
                                {req.status === 'Approved' && (
                                  <button
                                    type="button"
                                    className="btn btn-accent btn-sm"
                                    onClick={() =>
                                      handleRequestAction(
                                        req._id,
                                        'pickup',
                                        'Pickup confirmed!'
                                      )
                                    }
                                  >
                                    <Truck size={14} /> Confirm Picked Up
                                  </button>
                                )}
                                {req.status === 'Picked Up' && (
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() =>
                                      handleRequestAction(
                                        req._id,
                                        'complete',
                                        'Donation marked completed!'
                                      )
                                    }
                                  >
                                    <CheckCircle size={14} /> Mark Completed
                                  </button>
                                )}
                                {req.status === 'Completed' && don._id && (
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() =>
                                      setReviewTarget({
                                        donationId: don._id,
                                        foodName: don.foodName,
                                        revieweeId: donor._id,
                                      })
                                    }
                                  >
                                    <Star size={14} /> Rate Donor
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 style={{ fontSize: '1.2rem', marginBottom: 14 }}>Past Donation History</h2>
              {historyRequests.length === 0 ? (
                <EmptyState
                  title="No completed or past requests yet"
                  description="Your completed rescues and past requests will appear here."
                />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Food Item</th>
                        <th>Donor</th>
                        <th>Quantity</th>
                        <th>Updated</th>
                        <th>Status</th>
                        <th>Review</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyRequests.map((req) => {
                        const don = req.donationId || {};
                        const donor = don.donorId || {};
                        return (
                          <tr key={req._id}>
                            <td>{don.foodName || 'Removed listing'}</td>
                            <td>{donor.organizationName || donor.name || 'Donor'}</td>
                            <td>
                              {req.requestedQuantity} {don.unit}
                            </td>
                            <td>{formatDateTime(req.updatedAt)}</td>
                            <td>
                              <StatusBadge status={req.status} />
                            </td>
                            <td>
                              {req.status === 'Completed' && don._id && (
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() =>
                                    setReviewTarget({
                                      donationId: don._id,
                                      foodName: don.foodName,
                                      revieweeId: donor._id,
                                    })
                                  }
                                >
                                  <Star size={14} /> Leave Review
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && <ProfileSection />}
        </>
      )}

      <ReviewModal
        isOpen={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        donationId={reviewTarget?.donationId}
        foodName={reviewTarget?.foodName}
        revieweeId={reviewTarget?.revieweeId}
        onSubmitted={() => showToast('Review submitted! Thank you.')}
      />
    </DashboardLayout>
  );
};

export default NgoDashboard;
