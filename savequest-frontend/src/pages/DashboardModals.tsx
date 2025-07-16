import React from 'react';
import axios from 'axios';

// --- Sync Transactions Modal ---
const SyncTransactionsModal: React.FC<{ closeModal: () => void }> = ({ closeModal }) => {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const userId = localStorage.getItem('userId');

  const handleSync = async () => {
    if (!userId) {
      setError('User ID not found. Please sign in again.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Get JWT from localStorage (assume stored as 'token')
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/user-challenges/sync-transactions`,
        { userId, days: 90 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setResult(res.data.message || 'Transactions synced successfully!');
      } else {
        setError(res.data.message || 'Sync failed.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Sync failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Sync Transactions</div>
      <div style={{ color: '#666', fontSize: 15, marginBottom: 16 }}>
        Click below to manually sync your latest transactions from your linked bank account.
      </div>
      {result && <div style={{ color: 'green', marginBottom: 12 }}>{result}</div>}
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <button
        onClick={handleSync}
        disabled={loading}
        style={{
          background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 8
        }}
      >
        {loading ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
};

interface DashboardModalsProps {
  modal: null | 'join' | 'view' | 'link' | 'sync';
  closeModal: () => void;
}

const modalBackdrop: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.18)',
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalBox: React.CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  boxShadow: '0 4px 24px rgba(60,64,67,.13)',
  padding: 32,
  minWidth: 320,
  maxWidth: '90vw',
  textAlign: 'center',
  position: 'relative',
};

const closeBtn: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 16,
  background: 'none',
  border: 'none',
  fontSize: 22,
  color: '#888',
  cursor: 'pointer',
};

const DashboardModals: React.FC<DashboardModalsProps> = ({ modal, closeModal }) => {
  if (!modal) return null;
  return (
    <div style={modalBackdrop} onClick={closeModal}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <button style={closeBtn} onClick={closeModal} aria-label="Close">×</button>
        {modal === 'join' && <div>
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Join a Challenge</div>
          <div style={{ color: '#666', fontSize: 15 }}>Feature coming soon!</div>
        </div>}
        {modal === 'view' && <div>
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Your Challenges</div>
          <div style={{ color: '#666', fontSize: 15 }}>Feature coming soon!</div>
        </div>}
        {modal === 'link' && <div>
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Link Your Bank</div>
          <div style={{ color: '#666', fontSize: 15 }}>Feature coming soon!</div>
        </div>}
        {modal === 'sync' && <SyncTransactionsModal closeModal={closeModal} />}
      </div>
    </div>
  );

// ...existing code...
};


// ...existing code...
export { DashboardModals };
