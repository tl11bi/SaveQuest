import React from 'react';

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
        {modal === 'sync' && <div>
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Sync Transactions</div>
          <div style={{ color: '#666', fontSize: 15 }}>Feature coming soon!</div>
        </div>}
      </div>
    </div>
  );
};

export default DashboardModals;
