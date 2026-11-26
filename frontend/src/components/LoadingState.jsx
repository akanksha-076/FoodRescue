import { Loader2 } from 'lucide-react';

const LoadingState = ({ message = 'Loading data...' }) => (
  <div
    style={{
      padding: '48px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      color: 'var(--text-muted)',
    }}
  >
    <Loader2 size={30} className="spin" style={{ color: 'var(--forest)' }} />
    <span style={{ fontSize: '0.94rem', fontWeight: 500 }}>{message}</span>
    <style>{`
      .spin { animation: fr-spin 0.9s linear infinite; }
      @keyframes fr-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `}</style>
  </div>
);

export default LoadingState;
