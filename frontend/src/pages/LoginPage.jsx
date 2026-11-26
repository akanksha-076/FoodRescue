import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Sprout } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage } from '../services/api';
import { getDashboardPathForRole } from '../utils/formatters';

const DEMO_ACCOUNTS = [
  { label: 'Donor', email: 'donor@greenbistro.com', password: 'Password@123' },
  { label: 'NGO', email: 'ngo@hopeharvest.org', password: 'Password@123' },
  { label: 'Admin', email: 'admin@foodrescue.org', password: 'Password@123' },
];

const LoginPage = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await login({ email: email.trim(), password });
      showToast(`Welcome back, ${user.name}!`);
      const redirectTo = location.state?.from?.pathname || getDashboardPathForRole(user.role);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="container" style={{ padding: '56px 20px', maxWidth: 480 }}>
        <div className="card">
          <div className="card-body" style={{ padding: 30 }}>
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div
                className="brand-icon"
                style={{ margin: '0 auto 12px', width: 46, height: 46 }}
              >
                <Sprout size={24} />
              </div>
              <h1 style={{ fontSize: '1.6rem', marginBottom: 6 }}>Sign In to FoodRescue</h1>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Access your Donor, NGO, or Administrator workspace.
              </p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@organization.org"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-password">
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    style={{ paddingRight: 42 }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
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

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 6 }}
                disabled={submitting}
              >
                <LogIn size={17} />
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                Quick-Fill Seeded Demo Credentials (Database Backed):
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.label}
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword(acc.password);
                    }}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>

            <p style={{ textAlign: 'center', margin: '20px 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              New to FoodRescue?{' '}
              <Link to="/register" style={{ color: 'var(--forest)', fontWeight: 700 }}>
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default LoginPage;
