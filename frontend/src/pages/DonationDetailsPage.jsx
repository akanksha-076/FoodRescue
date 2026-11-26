import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldAlert,
  ThermometerSnowflake,
  Building2,
  Phone,
  BadgeCheck,
  Utensils,
  Send,
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { extractErrorMessage, resolveImageUrl } from '../services/api';
import { formatDateTime, formatTimeRemaining } from '../utils/formatters';

const DonationDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [donation, setDonation] = useState(null);
  const [myRequest, setMyRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [requestedQuantity, setRequestedQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/donations/${id}`);
      const d = data.data.donation;
      setDonation(d);
      setMyRequest(data.data.myRequest || null);
      if (d.availableQuantity > 0) {
        setRequestedQuantity(Math.min(d.availableQuantity, 10));
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/requests', {
        donationId: donation._id,
        requestedQuantity: Number(requestedQuantity),
        message,
      });
      showToast('Donation request sent to the donor!');
      setMessage('');
      fetchDetails();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusAction = async (action) => {
    if (!myRequest) return;
    try {
      await api.patch(`/requests/${myRequest._id}/${action}`);
      showToast(`Request updated (${action}).`);
      fetchDetails();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <LoadingState message="Loading donation details..." />
      </MainLayout>
    );
  }

  if (error || !donation) {
    return (
      <MainLayout>
        <div className="container" style={{ padding: '48px 20px' }}>
          <div className="alert alert-error">{error || 'Donation not found.'}</div>
          <Link to="/donations" className="btn btn-outline">
            <ArrowLeft size={16} /> Back to Browse
          </Link>
        </div>
      </MainLayout>
    );
  }

  const donor = donation.donorId || {};
  const imgUrl = resolveImageUrl(donation.image);
  const canRequest =
    user?.role === 'ngo' &&
    donation.availableQuantity > 0 &&
    ['Available', 'Requested'].includes(donation.status) &&
    new Date(donation.pickupDeadline) > new Date() &&
    (!myRequest || ['Rejected', 'Cancelled', 'Expired'].includes(myRequest.status));

  const pctRemaining =
    donation.quantity > 0
      ? Math.round((donation.availableQuantity / donation.quantity) * 100)
      : 0;

  return (
    <MainLayout>
      <div className="container" style={{ padding: '32px 20px 64px' }}>
        <Link
          to="/donations"
          className="btn btn-outline btn-sm"
          style={{ marginBottom: 20 }}
        >
          <ArrowLeft size={15} /> Back to Donations
        </Link>

        <div className="grid-2" style={{ gap: 28, alignItems: 'start' }}>
          {/* Left Column: Media & Safety Metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ height: 320, background: 'var(--mint-soft)' }}>
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={donation.foodName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="donation-card-fallback">
                    <Utensils size={48} />
                    <span>{donation.category}</span>
                  </div>
                )}
              </div>
              <div className="card-body">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <StatusBadge status={donation.status} />
                  <span
                    style={{
                      background: 'var(--mint-light)',
                      color: 'var(--forest)',
                      padding: '4px 12px',
                      borderRadius: 999,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    {donation.category}
                  </span>
                </div>

                <h1 style={{ fontSize: '1.7rem', marginBottom: 10 }}>{donation.foodName}</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>{donation.description}</p>

                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.88rem',
                      marginBottom: 6,
                    }}
                  >
                    <span>
                      Available Quantity: <strong>{donation.availableQuantity}</strong> /{' '}
                      {donation.quantity} {donation.unit}
                    </span>
                    <span style={{ color: 'var(--forest-mid)', fontWeight: 700 }}>
                      {pctRemaining}% left
                    </span>
                  </div>
                  <div
                    style={{
                      height: 10,
                      borderRadius: 999,
                      background: 'var(--mint-soft)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pctRemaining}%`,
                        height: '100%',
                        background: 'var(--forest-mid)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card card-body">
              <h3 style={{ fontSize: '1.08rem', marginBottom: 14 }}>Food Safety &amp; Logistics</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.92rem' }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <MapPin size={18} color="var(--forest-mid)" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Pickup Address:</strong> {donation.pickupLocation}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Clock size={18} color="var(--orange)" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Pickup Deadline:</strong> {formatDateTime(donation.pickupDeadline)} (
                    <span style={{ color: 'var(--orange)', fontWeight: 600 }}>
                      {formatTimeRemaining(donation.pickupDeadline)}
                    </span>
                    )
                  </div>
                </div>
                <div>
                  <strong>Prepared At:</strong> {formatDateTime(donation.preparedAt)}
                </div>
                <div>
                  <strong>Use By:</strong> {formatDateTime(donation.useBy)}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <ShieldAlert size={18} color="var(--orange)" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Allergens:</strong> {donation.allergenInformation || 'None specified'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <ThermometerSnowflake size={18} color="var(--forest-mid)" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Storage:</strong> {donation.storageInformation || 'Standard food-safe'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Donor Info & NGO Request Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card card-body">
              <h3 style={{ fontSize: '1.08rem', marginBottom: 12 }}>Donor Organization</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div className="kpi-icon">
                  <Building2 size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {donor.organizationName || donor.name}
                    {donor.isVerified && <BadgeCheck size={16} color="var(--leaf)" />}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Contact: {donor.name}
                  </div>
                </div>
              </div>
              {donor.phone && (
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={15} /> {donor.phone}
                </div>
              )}
            </div>

            {myRequest && (
              <div className="card card-body" style={{ borderColor: 'var(--forest-mid)' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <h3 style={{ fontSize: '1.05rem' }}>Your NGO Request</h3>
                  <StatusBadge status={myRequest.status} />
                </div>
                <p style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Requested <strong>{myRequest.requestedQuantity} {donation.unit}</strong> on{' '}
                  {formatDateTime(myRequest.createdAt)}.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {['Requested', 'Approved'].includes(myRequest.status) && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleStatusAction('cancel')}
                    >
                      Cancel Request
                    </button>
                  )}
                  {myRequest.status === 'Approved' && (
                    <button
                      type="button"
                      className="btn btn-accent btn-sm"
                      onClick={() => handleStatusAction('pickup')}
                    >
                      Confirm Picked Up
                    </button>
                  )}
                  {myRequest.status === 'Picked Up' && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleStatusAction('complete')}
                    >
                      Confirm Completion
                    </button>
                  )}
                </div>
              </div>
            )}

            {canRequest && (
              <div className="card card-body">
                <h3 style={{ fontSize: '1.15rem', marginBottom: 8 }}>Request This Food</h3>
                <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Specify how many {donation.unit} your NGO can safely collect before the deadline.
                </p>

                <form onSubmit={handleRequestSubmit}>
                  <div className="form-group">
                    <label className="form-label">
                      Required Quantity ({donation.unit}) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={donation.availableQuantity}
                      className="form-control"
                      value={requestedQuantity}
                      onChange={(e) => setRequestedQuantity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pickup Message to Donor</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Estimated pickup time, vehicle details, or special notes..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-accent"
                    style={{ width: '100%' }}
                    disabled={submitting}
                  >
                    <Send size={16} />
                    {submitting ? 'Submitting Request...' : 'Request Food'}
                  </button>
                </form>
              </div>
            )}

            {!user && (
              <div className="card card-body" style={{ background: 'var(--mint-soft)' }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: 6 }}>Want to claim this donation?</h3>
                <p style={{ margin: '0 0 14px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Sign in or register as a verified NGO / Receiver to request surplus food.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link to="/login" className="btn btn-primary btn-sm">
                    Sign In
                  </Link>
                  <Link to="/register?role=ngo" className="btn btn-outline btn-sm">
                    Register NGO
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DonationDetailsPage;
