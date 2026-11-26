import { BadgeCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = ({ navItems, activeTab, onTabChange, children }) => {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="dashboard-shell">
        <aside className="dashboard-sidebar">
          {user && (
            <div className="sidebar-user-box">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--forest-mid)', textTransform: 'uppercase' }}>
                {user.role === 'ngo' ? 'NGO / Receiver' : user.role}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{user.organizationName || user.name}</span>
                {user.isVerified && <BadgeCheck size={15} color="var(--leaf)" />}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => onTabChange(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
