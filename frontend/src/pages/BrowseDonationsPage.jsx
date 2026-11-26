import { useEffect, useState, useCallback } from 'react';
import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import DonationCard from '../components/DonationCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import api, { extractErrorMessage } from '../services/api';
import { DONATION_CATEGORIES, DONATION_STATUSES } from '../utils/formatters';

const BrowseDonationsPage = () => {
  const [filters, setFilters] = useState({
    q: '',
    category: 'All',
    location: '',
    minQuantity: '',
    deadlineBefore: '',
    status: 'Open',
    sort: 'newest',
  });
  const [page, setPage] = useState(1);
  const [donations, setDonations] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDonations = useCallback(async (currentFilters, targetPage) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (currentFilters.q.trim()) params.set('q', currentFilters.q.trim());
      if (currentFilters.category !== 'All') params.set('category', currentFilters.category);
      if (currentFilters.location.trim()) params.set('location', currentFilters.location.trim());
      if (currentFilters.minQuantity) params.set('minQuantity', currentFilters.minQuantity);
      if (currentFilters.deadlineBefore) {
        params.set('deadlineBefore', new Date(currentFilters.deadlineBefore).toISOString());
      }
      if (currentFilters.status !== 'All') params.set('status', currentFilters.status);
      params.set('sort', currentFilters.sort);
      params.set('page', String(targetPage));
      params.set('limit', '9');

      const { data } = await api.get(`/donations?${params.toString()}`);
      setDonations(data.data.donations || []);
      setPagination(data.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDonations(filters, page);
  }, [fetchDonations, filters, page]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setPage(1);
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setPage(1);
    setFilters({
      q: '',
      category: 'All',
      location: '',
      minQuantity: '',
      deadlineBefore: '',
      status: 'Open',
      sort: 'newest',
    });
  };

  return (
    <MainLayout>
      <div className="container" style={{ padding: '36px 20px 64px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.9rem', marginBottom: 6 }}>Browse Surplus Food Donations</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Search and filter available food donations by category, pickup area, quantity, and
            deadline.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="card-body">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--forest)' }}>
                <SlidersHorizontal size={17} /> Search &amp; Filters
              </span>
              <button type="button" className="btn btn-outline btn-sm" onClick={resetFilters}>
                <RotateCcw size={14} /> Reset
              </button>
            </div>

            <div className="grid-3" style={{ gap: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Keyword</label>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  />
                  <input
                    name="q"
                    className="form-control"
                    style={{ paddingLeft: 36 }}
                    value={filters.q}
                    onChange={handleFilterChange}
                    placeholder="Food name or description..."
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Category</label>
                <select
                  name="category"
                  className="form-control"
                  value={filters.category}
                  onChange={handleFilterChange}
                >
                  <option value="All">All Categories</option>
                  {DONATION_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Location</label>
                <input
                  name="location"
                  className="form-control"
                  value={filters.location}
                  onChange={handleFilterChange}
                  placeholder="City or neighborhood..."
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Min Available Qty</label>
                <input
                  type="number"
                  min={1}
                  name="minQuantity"
                  className="form-control"
                  value={filters.minQuantity}
                  onChange={handleFilterChange}
                  placeholder="e.g., 10"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Pickup Before</label>
                <input
                  type="datetime-local"
                  name="deadlineBefore"
                  className="form-control"
                  value={filters.deadlineBefore}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="grid-2" style={{ gap: 10 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    className="form-control"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <option value="Open">Open (Claimable)</option>
                    <option value="All">All Statuses</option>
                    {DONATION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Sort By</label>
                  <select
                    name="sort"
                    className="form-control"
                    value={filters.sort}
                    onChange={handleFilterChange}
                  >
                    <option value="newest">Newest</option>
                    <option value="deadline">Urgent Deadline</option>
                    <option value="quantity">Highest Qty</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <LoadingState message="Searching available donations..." />
        ) : donations.length === 0 ? (
          <EmptyState
            title="No matching donations found"
            description="Try clearing some filters or switching status to All Statuses."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={resetFilters}>
                Clear Filters
              </button>
            }
          />
        ) : (
          <>
            <div style={{ marginBottom: 14, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Showing <strong>{donations.length}</strong> of <strong>{pagination.total}</strong>{' '}
              listings
            </div>

            <div className="grid-3">
              {donations.map((d) => (
                <DonationCard key={d._id} donation={d} />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 32,
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default BrowseDonationsPage;
