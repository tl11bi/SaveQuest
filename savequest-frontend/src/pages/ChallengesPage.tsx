import * as React from 'react';
import styles from './DashboardStyles';
import { getUserChallenges, checkInChallenge, joinChallenge } from '../api/axios';
import ChallengeCard from './modals/ChallengeCard';
import { UserChallenge } from './modals/ViewChallengesModal';
import { JoinChallengeModal } from './modals/JoinChallengeModal';

interface ChallengesPageProps {
  user: { name: string; photo: string };
}

const ChallengesPage: React.FC<ChallengesPageProps> = ({ user }) => {
  const [userChallenges, setUserChallenges] = React.useState<UserChallenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = React.useState(true);
  const [checkingIn, setCheckingIn] = React.useState<string | null>(null);
  const [rejoining, setRejoining] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = React.useState(false);

  // Load user challenges
  React.useEffect(() => {
    const loadUserChallenges = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setLoadingChallenges(false);
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const apiService = (await import('../api/axios')).default;
          apiService.setAuthToken(token);
        }
        const response = await getUserChallenges(userId);
        if (response.data.success) {
          setUserChallenges(response.data.challenges || []);
        }
      } catch (err) {
        console.error('Failed to load user challenges:', err);
        setError('Failed to load your challenges.');
      } finally {
        setLoadingChallenges(false);
      }
    };
    loadUserChallenges();
  }, []);

  const handleCheckIn = async (challengeId: string, challengeTitle: string) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('User ID not found. Please sign in again.');
      return;
    }
    setCheckingIn(challengeId);
    setError(null);
    setSuccess(null);
    try {
      const response = await checkInChallenge(userId, challengeId);
      if (response.status === 200) {
        setSuccess(`Check-in successful for "${challengeTitle}"!`);
        // Refresh challenges
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
      setCheckingIn(null);
    }
  };

  const handleRejoin = async (challengeId: string, challengeTitle: string) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('User ID not found. Please sign in again.');
      return;
    }
    setRejoining(challengeId);
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
      setRejoining(null);
    }
  };

  const getStatusFilter = (status: string) => {
    switch (status) {
      case 'active':
        return userChallenges.filter(c => (c.status || 'active').toLowerCase() === 'active');
      case 'completed':
        return userChallenges.filter(c => (c.status || '').toLowerCase() === 'completed');
      case 'failed':
        return userChallenges.filter(c => (c.status || '').toLowerCase() === 'failed');
      default:
        return userChallenges;
    }
  };

  const [selectedFilter, setSelectedFilter] = React.useState<'all' | 'active' | 'completed' | 'failed'>('all');

  const filteredChallenges = getStatusFilter(selectedFilter === 'all' ? '' : selectedFilter);

  const getStatusCount = (status: string) => {
    return getStatusFilter(status).length;
  };

  const filterButtonStyle = (filter: string, isSelected: boolean) => ({
    padding: '8px 16px',
    borderRadius: 20,
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    backgroundColor: isSelected ? '#1976d2' : '#f5f5f5',
    color: isSelected ? '#fff' : '#666',
    transition: 'all 0.2s ease',
  });

  return (
    <div style={styles.pageContainer as React.CSSProperties}>
      <header style={styles.appBar as React.CSSProperties}>
        <span style={styles.logo as React.CSSProperties}>SaveQuest</span>
        <div style={styles.profileRow as React.CSSProperties}>
          <img 
            src={user.photo || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM0Mjg1RjQiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik04IDhDMTAuMjA5MSA4IDEyIDYuMjA5MTQgMTIgNEMxMiAxLjc5MDg2IDEwLjIwOTEgMCA4IDBDNS43OTA4NiAwIDQgMS43OTA4NiA0IDRDNCA2LjIwOTE0IDUuNzkwODYgOCA4IDhaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTYgMTZWMTRDMTYgMTEuNzkwOSAxNC4yMDkxIDEwIDEyIDEwSDRDMS43OTA4NiAxMCAwIDExLjc5MDkgMCAxNFYxNkgxNloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4='} 
            alt="Profile" 
            style={styles.profileIcon as React.CSSProperties}
          />
        </div>
      </header>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#333' }}>My Challenges</h1>
        <p style={{ color: '#666', fontSize: 16, marginBottom: 20 }}>Track your progress and check in daily!</p>

        {/* Status Messages */}
        {success && (
          <div style={{ 
            color: '#4caf50', 
            marginBottom: 16, 
            padding: '12px 16px', 
            backgroundColor: '#e8f5e8', 
            borderRadius: 8, 
            border: '1px solid #4caf50',
            fontSize: 14
          }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{ 
            color: '#f44336', 
            marginBottom: 16, 
            padding: '12px 16px', 
            backgroundColor: '#ffeaea', 
            borderRadius: 8, 
            border: '1px solid #f44336',
            fontSize: 14
          }}>
            {error}
          </div>
        )}

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <button
            style={filterButtonStyle('all', selectedFilter === 'all')}
            onClick={() => setSelectedFilter('all')}
          >
            All ({userChallenges.length})
          </button>
          <button
            style={filterButtonStyle('active', selectedFilter === 'active')}
            onClick={() => setSelectedFilter('active')}
          >
            Active ({getStatusCount('active')})
          </button>
          <button
            style={filterButtonStyle('completed', selectedFilter === 'completed')}
            onClick={() => setSelectedFilter('completed')}
          >
            Completed ({getStatusCount('completed')})
          </button>
          <button
            style={filterButtonStyle('failed', selectedFilter === 'failed')}
            onClick={() => setSelectedFilter('failed')}
          >
            Failed ({getStatusCount('failed')})
          </button>
        </div>
      </div>

      {/* Challenges List */}
      <div style={{ marginBottom: 80 }}>
        {loadingChallenges ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>Loading your challenges...</div>
            <div style={{ fontSize: 14, color: '#999' }}>Please wait while we fetch your data</div>
          </div>
        ) : filteredChallenges.length > 0 ? (
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {filteredChallenges.map((userChallenge) => (
              <ChallengeCard
                key={userChallenge.userChallengeId}
                userChallenge={userChallenge}
                checkingIn={checkingIn === userChallenge.challengeId}
                onCheckIn={handleCheckIn}
                onRejoin={handleRejoin}
              />
            ))}
          </div>
        ) : selectedFilter === 'all' ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: 12, 
            border: '2px dashed #dee2e6' 
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#333' }}>No challenges yet!</div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
              Start your savings journey by joining your first challenge.
            </div>
            <button 
              style={{ 
                background: '#1976d2', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                padding: '12px 24px', 
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer'
              }}
              onClick={() => {
                setShowJoinModal(true);
              }}
            >
              Join Your First Challenge
            </button>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: 12 
          }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#333' }}>
              No {selectedFilter} challenges
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>
              {selectedFilter === 'active' && 'You don\'t have any active challenges. Join a new challenge to get started!'}
              {selectedFilter === 'completed' && 'You haven\'t completed any challenges yet. Keep working on your active ones!'}
              {selectedFilter === 'failed' && 'No failed challenges. Great job staying on track!'}
            </div>
          </div>
        )}
      </div>

      {/* Join Challenge Modal */}
      {showJoinModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            maxWidth: 420,
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          }}>
            <JoinChallengeModal closeModal={() => setShowJoinModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengesPage;
