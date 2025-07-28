import React from 'react';
import { getAvailableChallenges, joinChallenge, getUserChallenges } from '../../api/axios';

interface Challenge {
  id: string;
  title: string;
  description: string;
  ruleType: 'spend_block' | 'spend_cap' | 'replacement' | 'streak_goal';
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface UserChallenge {
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

const JoinChallengeModal: React.FC<{ closeModal: () => void }> = ({ closeModal }) => {
  const [loading, setLoading] = React.useState(false);
  const [joining, setJoining] = React.useState(false);
  const [challenges, setChallenges] = React.useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = React.useState<UserChallenge[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const userId = localStorage.getItem('userId');

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const apiService = (await import('../../api/axios')).default;
          apiService.setAuthToken(token);
        }
        
        // Load available challenges
        const challengesResponse = await getAvailableChallenges();
        if (challengesResponse.data.success) {
          setChallenges(challengesResponse.data.challenges || []);
        } else {
          setError('Failed to load challenges.');
          return;
        }

        // Load user's joined challenges if userId exists
        if (userId) {
          try {
            const userChallengesResponse = await getUserChallenges(userId);
            if (userChallengesResponse.data.success) {
              setUserChallenges(userChallengesResponse.data.challenges || []);
            }
          } catch (userErr) {
            // Don't fail if user challenges can't be loaded
            console.warn('Could not load user challenges:', userErr);
          }
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load challenges.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);

  // Helper function to get user's challenge status for a given challenge ID
  const getUserChallengeStatus = (challengeId: string) => {
    const userChallenge = userChallenges.find(uc => uc.challengeId === challengeId);
    return userChallenge?.status || null;
  };

  // Helper function to check if user has joined a challenge
  const hasJoinedChallenge = (challengeId: string) => {
    return userChallenges.some(uc => uc.challengeId === challengeId);
  };

  const handleJoinChallenge = async (challengeId: string, challengeTitle: string) => {
    if (!userId) {
      setError('User ID not found. Please sign in again.');
      return;
    }
    setJoining(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await joinChallenge(userId, challengeId);
      if (response.status === 201) {
        setSuccess(`Successfully joined "${challengeTitle}"!`);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to join challenge.');
    } finally {
      setJoining(false);
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
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Join a Challenge</div>
      <div style={{ color: '#666', fontSize: 15, marginBottom: 16 }}>
        Choose a challenge to start your savings journey!
      </div>
      {success && (
        <div style={{ color: 'green', marginBottom: 12, padding: '8px 12px', backgroundColor: '#e8f5e8', borderRadius: 6, border: '1px solid #4caf50' }}>{success}</div>
      )}
      {error && (
        <div style={{ color: '#d32f2f', marginBottom: 12, padding: '8px 12px', backgroundColor: '#ffeaea', borderRadius: 6, border: '1px solid #f44336' }}>{error}</div>
      )}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>Loading challenges...</div>
      ) : challenges.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#666' }}>
          No challenges available. Try seeding some challenges first!
        </div>
      ) : (
        <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: 16 }}>
          {challenges.map((challenge) => {
            const isJoined = hasJoinedChallenge(challenge.id);
            const userStatus = getUserChallengeStatus(challenge.id);
            const buttonDisabled = joining || isJoined;
            
            return (
              <div key={challenge.id} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, marginBottom: 12, backgroundColor: isJoined ? '#f5f5f5' : '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{challenge.title}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {isJoined && (
                      <span style={{ backgroundColor: userStatus === 'failed' ? '#f44336' : '#4caf50', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
                        {userStatus || 'JOINED'}
                      </span>
                    )}
                    <span style={{ backgroundColor: getDifficultyColor(challenge.difficulty), color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>{challenge.difficulty}</span>
                  </div>
                </div>
                <div style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>{challenge.description}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#888', marginBottom: 12 }}>
                  <span><strong>Type:</strong> {getRuleTypeLabel(challenge.ruleType)}</span>
                  <span><strong>Duration:</strong> {challenge.duration} days</span>
                </div>
                <button 
                  onClick={() => handleJoinChallenge(challenge.id, challenge.title)} 
                  disabled={buttonDisabled} 
                  style={{ 
                    background: isJoined ? '#9e9e9e' : '#1976d2', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 6, 
                    padding: '8px 16px', 
                    fontWeight: 600, 
                    fontSize: 14, 
                    cursor: buttonDisabled ? 'not-allowed' : 'pointer', 
                    opacity: buttonDisabled ? 0.6 : 1, 
                    width: '100%' 
                  }}
                >
                  {joining ? 'Joining...' : isJoined ? (userStatus === 'failed' ? 'Already Joined (Failed)' : 'Already Joined') : 'Join Challenge'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export { JoinChallengeModal };
