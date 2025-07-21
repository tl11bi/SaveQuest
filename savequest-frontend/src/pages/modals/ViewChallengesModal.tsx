import React from 'react';
import { getUserChallenges, checkInChallenge, joinChallenge } from '../../api/axios';
import ChallengeList from './ChallengeList';
import StatusMessage from './StatusMessage';

export interface Challenge {
  title: string;
  description: string;
  ruleType: 'spend_block' | 'spend_cap' | 'replacement' | 'streak_goal';
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  target?: {
    pfc_detailed?: string;
    merchants?: string[];
  };
  reward?: {
    type: string;
    value: string;
    description: string;
  };
  isActive?: boolean;
  createdAt?: any;
}

export interface UserChallenge {
  userChallengeId: string;
  userId: string;
  challengeId: string;
  streak: number;
  status?: string;
  joinedAt?: string;
  lastCheckIn?: string | null;
  checkIns?: any[];
  challengeTemplate: Challenge;
}

const ViewChallengesModal: React.FC<{ closeModal: () => void }> = ({ closeModal }) => {
  const [loading, setLoading] = React.useState(false);
  const [checkingIn, setCheckingIn] = React.useState(false);
  const [rejoining, setRejoining] = React.useState(false);
  const [userChallenges, setUserChallenges] = React.useState<UserChallenge[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const userId = localStorage.getItem('userId');

  React.useEffect(() => {
    const loadUserChallenges = async () => {
      if (!userId) {
        setError('User ID not found. Please sign in again.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const apiService = (await import('../../api/axios')).default;
          apiService.setAuthToken(token);
        }
        const response = await getUserChallenges(userId);
        if (response.data.success) {
          setUserChallenges(response.data.challenges || []);
        } else {
          setError('Failed to load your challenges.');
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load your challenges.');
      } finally {
        setLoading(false);
      }
    };
    loadUserChallenges();
  }, [userId]);

  const handleCheckIn = async (challengeId: string, challengeTitle: string) => {
    if (!userId) {
      setError('User ID not found. Please sign in again.');
      return;
    }
    setCheckingIn(true);
    setError(null);
    setSuccess(null);
    
    // Use settlement lag - check in for yesterday to ensure transactions are settled
    const SETTLEMENT_LAG_DAYS = 1;
    const lagCutoff = new Date();
    lagCutoff.setDate(lagCutoff.getDate() - SETTLEMENT_LAG_DAYS);
    const checkInDate = lagCutoff.toISOString().split('T')[0];
    
    try {
      const response = await checkInChallenge(userId, challengeId, checkInDate);
      if (response.status === 200) {
        setSuccess(`Check-in successful for "${challengeTitle}" (${checkInDate})!`);
        const refreshResponse = await getUserChallenges(userId);
        if (refreshResponse.data.success) {
          setUserChallenges(refreshResponse.data.challenges || []);
        }
      }
    } catch (err: any) {
      const errorData = err?.response?.data;
      if (errorData?.challengeFailed) {
        setError(`Challenge "${challengeTitle}" has failed: ${errorData.message || 'Rule violation detected'}. You can rejoin to start fresh.`);
      } else {
        setError(errorData?.message || 'Check-in failed.');
      }
      // Refresh challenges to get updated status
      try {
        const refreshResponse = await getUserChallenges(userId);
        if (refreshResponse.data.success) {
          setUserChallenges(refreshResponse.data.challenges || []);
        }
      } catch (refreshErr) {
        console.error('Failed to refresh challenges:', refreshErr);
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const handleRejoin = async (challengeId: string, challengeTitle: string) => {
    if (!userId) {
      setError('User ID not found. Please sign in again.');
      return;
    }
    setRejoining(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await joinChallenge(userId, challengeId);
      if (response.status === 200 || response.status === 201) {
        setSuccess(`Successfully rejoined "${challengeTitle}"! Your progress has been reset.`);
        const refreshResponse = await getUserChallenges(userId);
        if (refreshResponse.data.success) {
          setUserChallenges(refreshResponse.data.challenges || []);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to rejoin challenge.');
    } finally {
      setRejoining(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return '#4caf50';
      case 'completed': return '#2196f3';
      case 'failed': return '#f44336';
      case 'paused': return '#ff9800';
      default: return '#4caf50'; // Default to active status color
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

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Your Challenges</div>
      <div style={{ color: '#666', fontSize: 15, marginBottom: 16 }}>
        Track your progress and check in daily!
      </div>
      {success && <StatusMessage type="success" message={success} />}
      {error && <StatusMessage type="error" message={error} />}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>Loading your challenges...</div>
      ) : userChallenges.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#666' }}>
          You haven't joined any challenges yet. Click "Join Challenge" to get started!
        </div>
      ) : (
        <ChallengeList userChallenges={userChallenges} checkingIn={checkingIn} onCheckIn={handleCheckIn} onRejoin={handleRejoin} />
      )}
    </div>
  );
};

export { ViewChallengesModal };
