import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Package,
  ClipboardList,
  BadgeCheck,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import { useToast } from '../context/ToastContext';
import api, { extractErrorMessage } from '../services/api';
import { formatDateTime } from '../utils/formatters';

const NAV_ITEMS = [
  { id: 'overview', label: 'Analytics & Stats', icon: BarChart3 },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'donations', label: 'Donation Listings', icon: Package },
  { id: 'requests', label: 'Monitor Requests', icon: ClipboardList },
];

const AdminDashboard = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, donRes, reqRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/donations'),
        api.get('/admin/requests'),
      ]);
      setStats(statsRes.data.data.stats);
      setUsers(usersRes.data.data.users || []);
      setDonations(donRes.data.data.donations || []);
      setRequests(reqRes.data.data.requests || []);
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleToggleVerify = async (u) => {
    try {
      await api.patch(`/admin/users/${u._id}/verify`, { isVerified: !u.isVerified });
      showToast(`${u.name} ${!u.isVerified ? 'verified' : 'unverified'}.`);
      loadAdminData();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const handleToggleSuspend = async (u) => {
    try {
      await api.patch(`/admin/users/${u._id}/suspend`, { isSuspended: !u.isSuspended });
      showToast(`${u.name} ${!u.isSuspended ? 'suspended' : 'reactivated'}.`);
      loadAdminData();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const handleDeleteDonation = async (id) => {
    try {
      await api.delete(`/admin/donations/${id}`);
      showToast('Donation listing removed by moderation.');
      loadAdminData();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.organizationName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const maxStatusCount = Math.max(
    1,
    ...(stats?.donationsByStatus?.map((s) => s.count) || [1])
  );
  const maxCatCount = Math.max(
    1,
    ...(stats?.donationsByCategory?.map((c) => c.count) || [1])
  );

  return (
    <DashboardLayout navItems={NAV_ITEMS} activeTab={activeTab} onTabChange={setActiveTab}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.65rem' }}>Platform Administration Console</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Verify partner accounts, moderate surplus listings, and monitor live rescue analytics.
        </p>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid-3" style={{ marginBottom: 26, gap: 16 }}>
          <div className="kpi-card">
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Users</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{stats.totalUsers}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {stats.totalDonors} Donors · {stats.totalNgos} NGOs
              </div>
            </div>
            <div className="kpi-icon">
              <Users size={22} />
            </div>
          </div>

          <div className="kpi-card">
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Donations</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--forest)' }}>
                {stats.totalDonations}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {stats.completedDonations} Completed · {stats.totalRescuedUnits} Units Rescued
              </div>
            </div>
            <div className="kpi-icon">
              <Package size={22} />
            </div>
          </div>

          <div className="kpi-card">
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Pending Verifications
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--orange)' }}>
                {stats.pendingVerifications}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {stats.suspendedUsers} Suspended Accounts
              </div>
            </div>
            <div className="kpi-icon" style={{ background: '#fff4ed', color: 'var(--orange)' }}>
              <ShieldAlert size={22} />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState message="Loading admin analytics..." />
      ) : (
        <>
          {activeTab === 'overview' && stats && (
            <div className="grid-2" style={{ gap: 22 }}>
              <div className="card card-body">
                <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Donations by Status</h3>
                {stats.donationsByStatus.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No donation data yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {stats.donationsByStatus.map((row) => (
                      <div key={row._id}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.86rem',
                            marginBottom: 4,
                          }}
                        >
                          <StatusBadge status={row._id} />
                          <strong>{row.count}</strong>
                        </div>
                        <div
                          style={{
                            height: 8,
                            borderRadius: 999,
                            background: 'var(--mint-soft)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.round((row.count / maxStatusCount) * 100)}%`,
                              height: '100%',
                              background: 'var(--forest-mid)',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card card-body">
                <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Donations by Category</h3>
                {stats.donationsByCategory.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No category data yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {stats.donationsByCategory.map((row) => (
                      <div key={row._id}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.86rem',
                            marginBottom: 4,
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{row._id}</span>
                          <strong>{row.count}</strong>
                        </div>
                        <div
                          style={{
                            height: 8,
                            borderRadius: 999,
                            background: '#fff4ed',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.round((row.count / maxCatCount) * 100)}%`,
                              height: '100%',
                              background: 'var(--orange)',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <h2 style={{ fontSize: '1.2rem' }}>Registered Users ({filteredUsers.length})</h2>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    className="form-control"
                    style={{ width: 220 }}
                    placeholder="Search name, email, org..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  <select
                    className="form-control"
                    style={{ width: 140 }}
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="donor">Donors</option>
                    <option value="ngo">NGOs</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>User / Organization</th>
                      <th>Role</th>
                      <th>Verification</th>
                      <th>Account Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{u.organizationName || u.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {u.name} · {u.email}
                          </div>
                        </td>
                        <td style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.8rem' }}>
                          {u.role}
                        </td>
                        <td>
                          {u.isVerified ? (
                            <span className="status-badge status-completed">
                              <BadgeCheck size={13} /> Verified
                            </span>
                          ) : (
                            <span className="status-badge status-requested">Pending</span>
                          )}
                        </td>
                        <td>
                          {u.isSuspended ? (
                            <span className="status-badge status-rejected">Suspended</span>
                          ) : (
                            <span className="status-badge status-available">Active</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => handleToggleVerify(u)}
                            >
                              <UserCheck size={14} /> {u.isVerified ? 'Unverify' : 'Verify'}
                            </button>
                            {u.role !== 'admin' && (
                              <button
                                type="button"
                                className={`btn btn-sm ${
                                  u.isSuspended ? 'btn-secondary' : 'btn-danger'
                                }`}
                                onClick={() => handleToggleSuspend(u)}
                              >
                                <UserX size={14} /> {u.isSuspended ? 'Reactivate' : 'Suspend'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'donations' && (
            <div>
              <h2 style={{ fontSize: '1.2rem', marginBottom: 14 }}>
                All Donation Listings ({donations.length})
              </h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Food Item</th>
                      <th>Donor</th>
                      <th>Qty Left</th>
                      <th>Pickup Deadline</th>
                      <th>Status</th>
                      <th>Moderation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map((d) => (
                      <tr key={d._id}>
                        <td>
                          <Link
                            to={`/donations/${d._id}`}
                            style={{ fontWeight: 700, color: 'var(--forest)' }}
                          >
                            {d.foodName}
                          </Link>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {d.category}
                          </div>
                        </td>
                        <td>{d.donorId?.organizationName || d.donorId?.name || 'Donor'}</td>
                        <td>
                          {d.availableQuantity} / {d.quantity} {d.unit}
                        </td>
                        <td>{formatDateTime(d.pickupDeadline)}</td>
                        <td>
                          <StatusBadge status={d.status} />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteDonation(d._id)}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              <h2 style={{ fontSize: '1.2rem', marginBottom: 14 }}>
                Platform Donation Requests ({requests.length})
              </h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Donation</th>
                      <th>Donor</th>
                      <th>Requesting NGO</th>
                      <th>Quantity</th>
                      <th>Updated</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r._id}>
                        <td>{r.donationId?.foodName || 'Removed'}</td>
                        <td>
                          {r.donationId?.donorId?.organizationName ||
                            r.donationId?.donorId?.name ||
                            'Donor'}
                        </td>
                        <td>{r.ngoId?.organizationName || r.ngoId?.name || 'NGO'}</td>
                        <td>
                          {r.requestedQuantity} {r.donationId?.unit || ''}
                        </td>
                        <td>{formatDateTime(r.updatedAt)}</td>
                        <td>
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
