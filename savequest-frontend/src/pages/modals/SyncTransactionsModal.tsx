import React from 'react';

const SyncTransactionsModal: React.FC<{ closeModal: () => void }> = ({ closeModal }) => {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Simulate API call for syncing transactions
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess('Transactions synced successfully!');
    } catch (err) {
      setError('Failed to sync transactions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Sync Transactions</div>
      <div style={{ color: '#666', fontSize: 15, marginBottom: 16 }}>
        Sync your latest transactions to keep your challenge progress up to date.
      </div>
      {success && (
        <div style={{ color: 'green', marginBottom: 12, padding: '8px 12px', backgroundColor: '#e8f5e8', borderRadius: 6, border: '1px solid #4caf50' }}>{success}</div>
      )}
      {error && (
        <div style={{ color: '#d32f2f', marginBottom: 12, padding: '8px 12px', backgroundColor: '#ffeaea', borderRadius: 6, border: '1px solid #f44336' }}>{error}</div>
      )}
      <button
        onClick={handleSync}
        disabled={loading}
        style={{
          background: '#2196f3',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '8px 16px',
          fontWeight: 600,
          fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          width: '100%',
        }}
      >
        {loading ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
};

export { SyncTransactionsModal };
