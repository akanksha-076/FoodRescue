import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Inbox,
  History,
  UserCircle,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  Truck,
  Check,
  Ban,
  BadgeCheck,
  Star,
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import DonationFormModal from '../components/DonationFormModal';
import ReviewModal from '../components/ReviewModal';
import ProfileSection from '../components/ProfileSection';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { extractErrorMessage } from '../services/api';
import { formatDateTime } from '../utils/formatters';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview & Listings', icon: LayoutDashboard },
  { id: 'requests', label: 'Incoming Requests', icon: Inbox },
  { id: 'history', label: 'Donation History', icon: History },
  { id: 'profile', label: 'Profile Settings', icon: UserCircle },
];

const DonorDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [donations, setDonations] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);

  const loadDonorData = useCallback(async () => {
    setLoading(true);
    try {
      const [donRes, reqRes] = await Promise.all([
        api.get('/donations/my'),
        api.get('/requests/incoming'),
      ]);
      setDonations(donRes.data.data.donations || []);
      setIncomingRequests(reqRes.data.data.requests || []);
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDonorData();
  }, [loadDonorData]);

  const handleRequestAction = async (requestId, action, successMsg) => {
    try {
      await api.patch(`/requests/${requestId}/${action}`);
      showToast(successMsg);
      loadDonorData();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const handleCancelDonation = async (id) => {
    try {
      await api.patch(`/donations/${id}/cancel`);
      showToast('Donation listing cancelled.');
      loadDonorData();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const handleDeleteDonation = async (id) => {
    try {
      await api.delete(`/donations/${id}`);
      showToast('Donation listing deleted.');
      loadDonorData();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const activeDonations = donations.filter((d) =>
    ['Available', 'Requested', 'Approved', 'Picked Up'].includes(d.status)
  );
  const historyDonations = donations.filter((d) =>
    ['Completed', 'Cancelled', 'Expired', 'Rejected'].includes(d.status)
  );
  const pendingRequests = incomingRequests.filter((r) => r.status === 'Requested');
  const completedCount = donations.filter((d) => d.status === 'Completed').length;

  return (
    <DashboardLayout navItems={NAV_ITEMS} activeTab={activeTab} onTabChange={setActiveTab}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.65rem' }}>
            Welcome, {user?.organizationName || user?.name}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Manage your surplus food listings, approve NGO pickups, and track community impact.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-accent"
          onClick={() => {
            setEditingDonation(null);
            setModalOpen(true);
          }}
        >
          <Plus size={18} /> Add Donation
        </button>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 26 }}>
        <div className="kpi-card">
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Donations</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800 }}>{donations.length}</div>
          </div>
          <div className="kpi-icon">
            <Package size={22} />
          </div>
        </div>
        <div className="kpi-card">
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Active Listings</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--forest)' }}>
              {activeDonations.length}
            </div>
          </div>
          <div className="kpi-icon">
            <Truck size={22} />
          </div>
        </div>
        <div className="kpi-card">
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Pending Requests</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--orange)' }}>
              {pendingRequests.length}
            </div>
          </div>
          <div className="kpi-icon" style={{ background: '#fff4ed', color: 'var(--orange)' }}>
            <Inbox size={22} />
          </div>
        </div>
        <div className="kpi-card">
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Completed</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#166534' }}>
              {completedCount}
            </div>
          </div>
          <div className="kpi-icon">
            <CheckCircle size={22} />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading donor workspace..." />
      ) : (
        <>
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', marginBottom: 14 }}>
                  Active &amp; Recent Donation Listings
                </h2>
                {donations.length === 0 ? (
                  <EmptyState
                    title="No donations published yet"
                    description="Publish your first surplus food listing so local NGOs can request pickup."
                    action={
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setModalOpen(true)}
                      >
                        <Plus size={15} /> Create Donation
                      </button>
                    }
                  />
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Food Item</th>
                          <th>Quantity</th>
                          <th>Pickup Deadline</th>
                          <th>Requests</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donations.map((d) => {
                          const editable = !['Completed', 'Cancelled', 'Expired'].includes(
                            d.status
                          );
                          return (
                            <tr key={d._id}>
                              <td>
                                <Link
                                  to={`/donations/${d._id}`}
                                  style={{ fontWeight: 700, color: 'var(--forest)' }}
                                >
                                  {d.foodName}
                                </Link>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  {d.category} · {d.pickupLocation}
                                </div>
                              </td>
                              <td>
                                <strong>{d.availableQuantity}</strong> / {d.quantity} {d.unit}
                              </td>
                              <td style={{ fontSize: '0.84rem' }}>
                                {formatDateTime(d.pickupDeadline)}
                              </td>
                              <td>
                                <span style={{ fontSize: '0.84rem' }}>
                                  {d.requestSummary?.pending || 0} pending /{' '}
                                  {d.requestSummary?.total || 0} total
                                </span>
                              </td>
                              <td>
                                <StatusBadge status={d.status} />
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  {editable && (
                                    <button
                                      type="button"
                                      className="btn btn-outline btn-sm"
                                      onClick={() => {
                                        setEditingDonation(d);
                                        setModalOpen(true);
                                      }}
                                      title="Edit listing"
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                  )}
                                  {['Available', 'Requested'].includes(d.status) && (
                                    <button
                                      type="button"
                                      className="btn btn-outline btn-sm"
                                      onClick={() => handleCancelDonation(d._id)}
                                      title="Cancel listing"
                                    >
                                      <Ban size={14} />
                                    </button>
                                  )}
                                  {!['Approved', 'Picked Up', 'Completed'].includes(d.status) && (
                                    <button
                                      type="button"
                                      className="btn btn-danger btn-sm"
                                      onClick={() => handleDeleteDonation(d._id)}
                                      title="Delete listing"
                                    >
                                      <Trash2 size={14} />
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
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              <h2 style={{ fontSize: '1.2rem', marginBottom: 14 }}>Incoming NGO Requests</h2>
              {incomingRequests.length === 0 ? (
                <EmptyState
                  title="No incoming requests yet"
                  description="When NGOs request your surplus food listings, they will appear here for approval."
                />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>NGO / Organization</th>
                        <th>Donation Item</th>
                        <th>Requested Qty</th>
                        <th>Message</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomingRequests.map((req) => {
                        const ngo = req.ngoId || {};
                        const don = req.donationId || {};
                        return (
                          <tr key={req._id}>
                            <td>
                              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                                {ngo.organizationName || ngo.name}
                                {ngo.isVerified && <BadgeCheck size={14} color="var(--leaf)" />}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {ngo.phone || ngo.email}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{don.foodName}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {don.availableQuantity} {don.unit} left
                              </div>
                            </td>
                            <td>
                              <strong>
                                {req.requestedQuantity} {don.unit}
                              </strong>
                            </td>
                            <td style={{ maxWidth: 220, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                              {req.message || 'No note provided'}
                            </td>
                            <td>
                              <StatusBadge status={req.status} />
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {req.status === 'Requested' && (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      onClick={() =>
                                        handleRequestAction(
                                          req._id,
                                          'approve',
                                          'Request approved!'
                                        )
                                      }
                                    >
                                      <Check size={14} /> Approve
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-danger btn-sm"
                                      onClick={() =>
                                        handleRequestAction(req._id, 'reject', 'Request rejected.')
                                      }
                                    >
                                      <XCircle size={14} /> Reject
                                    </button>
                                  </>
                                )}
                                {req.status === 'Approved' && (
                                  <button
                                    type="button"
                                    className="btn btn-accent btn-sm"
                                    onClick={() =>
                                      handleRequestAction(
                                        req._id,
                                        'pickup',
                                        'Marked as picked up!'
                                      )
                                    }
                                  >
                                    <Truck size={14} /> Mark Picked Up
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
                                        'Donation marked as completed!'
                                      )
                                    }
                                  >
                                    <CheckCircle size={14} /> Mark Completed
                                  </button>
                                )}
                                {req.status === 'Completed' && (
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() =>
                                      setReviewTarget({
                                        donationId: don._id,
                                        foodName: don.foodName,
                                        revieweeId: ngo._id,
                                      })
                                    }
                                  >
                                    <Star size={14} /> Review NGO
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
              <h2 style={{ fontSize: '1.2rem', marginBottom: 14 }}>Donation History</h2>
              {historyDonations.length === 0 ? (
                <EmptyState
                  title="No past donations yet"
                  description="Completed, cancelled, or expired listings will be archived here."
                />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Food Item</th>
                        <th>Category</th>
                        <th>Quantity</th>
                        <th>Created</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyDonations.map((d) => (
                        <tr key={d._id}>
                          <td>
                            <Link
                              to={`/donations/${d._id}`}
                              style={{ fontWeight: 700, color: 'var(--forest)' }}
                            >
                              {d.foodName}
                            </Link>
                          </td>
                          <td>{d.category}</td>
                          <td>
                            {d.quantity} {d.unit}
                          </td>
                          <td>{formatDateTime(d.createdAt)}</td>
                          <td>
                            <StatusBadge status={d.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && <ProfileSection />}
        </>
      )}

      <DonationFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialDonation={editingDonation}
        onSaved={() => {
          showToast(
            editingDonation ? 'Donation updated successfully.' : 'Donation published successfully.'
          );
          loadDonorData();
        }}
      />

      <ReviewModal
        isOpen={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        donationId={reviewTarget?.donationId}
        foodName={reviewTarget?.foodName}
        revieweeId={reviewTarget?.revieweeId}
        onSubmitted={() => showToast('Thank you for submitting your review!')}
      />
    </DashboardLayout>
  );
};

export default DonorDashboard;
