import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Building2, HeartHandshake, Shield } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage } from '../services/api';
import { getDashboardPathForRole } from '../utils/formatters';

const ROLE_OPTIONS = [
  {
    value: 'donor',
    title: 'Food Donor',
    desc: 'Restaurants, hotels, caterers & event hosts',
    icon: Building2,
  },
  {
    value: 'ngo',
    title: 'NGO / Receiver',
    desc: 'Charities, shelters & food banks',
    icon: HeartHandshake,
  },
  {
    value: 'admin',
    title: 'Administrator',
    desc: 'Platform moderation (requires setup key)',
    icon: Shield,
  },
];

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const initialRole = ['donor', 'ngo', 'admin'].includes(searchParams.get('role'))
    ? searchParams.get('role')
    : 'donor';

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: initialRole,
    organizationName: '',
    phone: '',
    address: '',
    adminSecret: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        organizationName: form.organizationName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        adminSecret: form.role === 'admin' ? form.adminSecret : undefined,
      });
      showToast('Account created successfully!');
      navigate(getDashboardPathForRole(user.role), { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="container" style={{ padding: '44px 20px', maxWidth: 660 }}>
        <div className="card">
          <div className="card-body" style={{ padding: 30 }}>
            <h1 style={{ fontSize: '1.65rem', marginBottom: 6 }}>Create Your FoodRescue Account</h1>
            <p style={{ margin: '0 0 22px', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Select your role to start donating surplus food or coordinating NGO pickups.
            </p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Select Role *</label>
                <div className="grid-3" style={{ gap: 12 }}>
                  {ROLE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const selected = form.role === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, role: opt.value }))}
                        style={{
                          textAlign: 'left',
                          padding: 14,
                          borderRadius: 'var(--radius-sm)',
                          border: selected ? '2px solid var(--forest)' : '1px solid var(--border)',
                          background: selected ? 'var(--mint-soft)' : 'var(--white)',
                          cursor: 'pointer',
                        }}
                      >
                        <Icon size={20} color="var(--forest)" />
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', marginTop: 6 }}>
                          {opt.title}
                        </div>
                        <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {opt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    name="name"
                    className="form-control"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g., Elena Rostova"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@organization.org"
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">
                    {form.role === 'ngo' ? 'NGO Name' : 'Organization / Restaurant Name'}
                  </label>
                  <input
                    name="organizationName"
                    className="form-control"
                    value={form.organizationName}
                    onChange={handleChange}
                    placeholder="e.g., HopeHarvest Foundation"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    name="phone"
                    className="form-control"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address / City</label>
                <input
                  name="address"
                  className="form-control"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Street address, neighborhood, city"
                />
              </div>

              {form.role === 'admin' && (
                <div className="form-group">
                  <label className="form-label">Admin Registration Key *</label>
                  <input
                    type="password"
                    name="adminSecret"
                    className="form-control"
                    value={form.adminSecret}
                    onChange={handleChange}
                    placeholder="Enter server ADMIN_REGISTRATION_KEY"
                    required
                  />
                </div>
              )}

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="form-control"
                      style={{ paddingRight: 40 }}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Minimum 6 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label="Toggle password visibility"
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    className="form-control"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 8 }}
                disabled={submitting}
              >
                <UserPlus size={17} />
                {submitting ? 'Creating Account...' : 'Register Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', margin: '20px 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--forest)', fontWeight: 700 }}>
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RegisterPage;
