import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Sprout, Menu, X, LayoutDashboard, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathForRole } from '../utils/formatters';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const dashboardPath = user ? getDashboardPathForRole(user.role) : '/login';

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand-logo" onClick={() => setMenuOpen(false)}>
          <span className="brand-icon">
            <Sprout size={21} />
          </span>
          <span>FoodRescue</span>
        </Link>

        <nav className="nav-links" aria-label="Primary">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Home
          </NavLink>
          <NavLink
            to="/donations"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Browse Donations
          </NavLink>
          <a href="/#how-it-works" className="nav-link">
            How It Works
          </a>
          <a href="/#about" className="nav-link">
            About
          </a>
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <Link to={dashboardPath} className="btn btn-secondary btn-sm">
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <Link to="/profile" className="btn btn-outline btn-sm">
                <UserCircle size={16} />
                {user.name.split(' ')[0]}
              </Link>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-drawer">
          <Link to="/" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link to="/donations" onClick={() => setMenuOpen(false)}>
            Browse Donations
          </Link>
          {user ? (
            <>
              <Link to={dashboardPath} onClick={() => setMenuOpen(false)}>
                Dashboard ({user.role.toUpperCase()})
              </Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>
                Profile Settings
              </Link>
              <button type="button" className="btn btn-danger btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <Link
                to="/login"
                className="btn btn-outline btn-sm"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
                onClick={() => setMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
