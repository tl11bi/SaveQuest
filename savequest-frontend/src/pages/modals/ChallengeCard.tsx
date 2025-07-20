import React from 'react';
import { UserChallenge } from './ViewChallengesModal';

interface ChallengeCardProps {
  userChallenge: UserChallenge;
  checkingIn: boolean;
  onCheckIn: (challengeId: string, challengeTitle: string) => void;
  onRejoin?: (challengeId: string, challengeTitle: string) => void;
}

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'active': return '#4caf50';
    case 'completed': return '#2196f3';
    case 'failed': return '#f44336';
    case 'paused': return '#ff9800';
    default: return '#4caf50';
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return '#4caf50';
    case 'medium': return '#ff9800';
    case 'hard': return '#f44336';
    default: return '#9e9e9e';
  }
};

const getRuleTypeLabel = (ruleType: string) => {
  switch (ruleType) {
    case 'spend_block': return 'Spend Block';
    case 'spend_cap': return 'Spend Cap';
    case 'replacement': return 'Replacement';
    case 'streak_goal': return 'Streak Goal';
    default: return ruleType;
  }
};

const ChallengeCard: React.FC<ChallengeCardProps> = ({ userChallenge, checkingIn, onCheckIn, onRejoin }) => {
  const isFailed = (userChallenge.status || 'active').toLowerCase() === 'failed';
  const isActive = (userChallenge.status || 'active').toLowerCase() === 'active';

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, marginBottom: 12, backgroundColor: isFailed ? '#fff5f5' : '#fafafa' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 16 }}>{userChallenge.challengeTemplate.title}</div>
        <span style={{ backgroundColor: getStatusColor(userChallenge.status), color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>{userChallenge.status || 'active'}</span>
      </div>
      <div style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>{userChallenge.challengeTemplate.description}</div>
      {isFailed && (
        <div style={{ backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: 6, padding: 8, marginBottom: 8, fontSize: 14, color: '#c33' }}>
          <strong>Challenge Failed!</strong> You can rejoin to start fresh.
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#888', marginBottom: 8 }}>
        <span><strong>Type:</strong> {getRuleTypeLabel(userChallenge.challengeTemplate.ruleType)}</span>
        <span><strong>Duration:</strong> {userChallenge.challengeTemplate.duration} days</span>
        <span style={{ backgroundColor: getDifficultyColor(userChallenge.challengeTemplate.difficulty), color: 'white', padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>{userChallenge.challengeTemplate.difficulty}</span>
      </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 24 }}>🔥</span>
        <span style={{ fontWeight: 600, fontSize: 18 }}>{userChallenge.streak}</span>
        <span style={{ fontSize: 14, color: '#666' }}>day streak</span>
      </div>
      {userChallenge.lastCheckIn && (
        <div style={{ fontSize: 12, color: '#888' }}>
          Last check-in: {new Date(userChallenge.lastCheckIn).toLocaleDateString()}
        </div>
      )}
    </div>
    {isActive && (
      <button onClick={() => onCheckIn(userChallenge.challengeId, userChallenge.challengeTemplate.title)} disabled={checkingIn} style={{ background: '#4caf50', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: checkingIn ? 'not-allowed' : 'pointer', opacity: checkingIn ? 0.6 : 1, width: '100%' }}>
        {checkingIn ? 'Checking in...' : 'Check In (Yesterday)'}
      </button>
    )}
    {isFailed && onRejoin && (
      <button onClick={() => onRejoin(userChallenge.challengeId, userChallenge.challengeTemplate.title)} style={{ background: '#f44336', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer', width: '100%' }}>
        Rejoin Challenge
      </button>
    )}
  </div>
  );
};

export default ChallengeCard;
