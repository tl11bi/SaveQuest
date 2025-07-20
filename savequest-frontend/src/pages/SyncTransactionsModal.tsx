import React, { useState } from 'react';
import { syncTransactions } from '../api/axios';

const SyncTransactionsModal: React.FC<{ closeModal: () => void }> = ({ closeModal }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Get userId from localStorage or context (assume it's stored as 'userId')
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
      const res = await syncTransactions(userId);
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

export default SyncTransactionsModal;
