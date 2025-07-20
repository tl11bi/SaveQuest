import React from 'react';
import axios from 'axios';
import { getAvailableChallenges, joinChallenge, getUserChallenges, checkInChallenge } from '../api/axios';
import { JoinChallengeModal } from './modals/JoinChallengeModal';
import { ViewChallengesModal } from './modals/ViewChallengesModal';
import { SyncTransactionsModal } from './modals/SyncTransactionsModal';

// Challenge interface based on the API spec

// Challenge interface based on the API spec
interface Challenge {
  id: string;
  title: string;
  description: string;
  ruleType: 'spend_block' | 'spend_cap' | 'replacement' | 'streak_goal';
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

// User Challenge interface
interface UserChallenge {
  userChallengeId: string;
  userId: string;
  challengeId: string;
  streak: number;
  status: string;
  joinedAt?: string;
  lastCheckIn?: string;
  challengeTemplate: Challenge;
}

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
  maxHeight: '90vh',
  overflowY: 'auto',
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
        {modal === 'join' && <JoinChallengeModal closeModal={closeModal} />}
        {modal === 'view' && <ViewChallengesModal closeModal={closeModal} />}
        {modal === 'link' && <div>
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Link Your Bank</div>
          <div style={{ color: '#666', fontSize: 15 }}>Feature coming soon!</div>
        </div>}
        {modal === 'sync' && <SyncTransactionsModal closeModal={closeModal} />}
      </div>
    </div>
  );
};


// ...existing code...
export { DashboardModals };
