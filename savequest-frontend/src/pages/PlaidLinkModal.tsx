import React, { useEffect, useState } from 'react';
import axios from '../api/axios';

interface PlaidLinkModalProps {
  userId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

declare global {
  interface Window {
    Plaid: any;
  }
}

const PlaidLinkModal: React.FC<PlaidLinkModalProps> = ({ userId, open, onClose, onSuccess }) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLinkToken(null);
      setError(null);
      setLoading(true);
      axios.post('/plaid/link-token', { userId })
        .then(res => {
          setLinkToken(res.data.link_token);
        })
        .catch(err => {
          setError('Failed to create link token.');
        })
        .finally(() => setLoading(false));
    }
  }, [open, userId]);

  useEffect(() => {
    if (!open || !linkToken) return;
    // Load Plaid script if not already loaded
    if (!window.Plaid) {
      const script = document.createElement('script');
      script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
      script.async = true;
      script.onload = () => {};
      document.body.appendChild(script);
    }
  }, [open, linkToken]);

  const handleOpenPlaid = () => {
    if (!window.Plaid || !linkToken) return;
    const handler = window.Plaid.create({
      token: linkToken,
      onSuccess: async (public_token: string, metadata: any) => {
        try {
          await axios.post('/plaid/exchange', { publicToken: public_token, userId });
          if (onSuccess) onSuccess();
          onClose();
        } catch (err) {
          setError('Failed to link bank account.');
        }
      },
      onExit: (err: any, metadata: any) => {
        if (err) setError('Plaid Link exited.');
      },
    });
    handler.open();
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(60,64,67,.13)', padding: 32, minWidth: 320, maxWidth: '90vw', textAlign: 'center', position: 'relative' }}>
        <button style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }} onClick={onClose} aria-label="Close">×</button>
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Link Your Bank</div>
        {loading && <div>Loading Plaid...</div>}
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        {!loading && !error && linkToken && (
          <button style={{ background: '#4285F4', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }} onClick={handleOpenPlaid}>
            Connect Bank Account
          </button>
        )}
      </div>
    </div>
  );
};

export default PlaidLinkModal;
