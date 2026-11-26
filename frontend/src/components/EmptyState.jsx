import { Inbox } from 'lucide-react';

const EmptyState = ({ title = 'Nothing here yet', description, action }) => (
  <div
    className="card"
    style={{
      padding: '44px 24px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
    }}
  >
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        background: 'var(--mint-soft)',
        color: 'var(--forest)',
        display: 'grid',
        placeItems: 'center',
        marginBottom: 4,
      }}
    >
      <Inbox size={26} />
    </div>
    <h3 style={{ fontSize: '1.08rem' }}>{title}</h3>
    {description && (
      <p style={{ margin: 0, color: 'var(--text-muted)', maxWidth: 420, fontSize: '0.92rem' }}>
        {description}
      </p>
    )}
    {action && <div style={{ marginTop: 8 }}>{action}</div>}
  </div>
);

export default EmptyState;
