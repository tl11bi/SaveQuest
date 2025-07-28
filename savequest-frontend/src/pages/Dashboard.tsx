



import * as React from 'react';
import styles from './DashboardStyles';
import { DashboardModals } from './DashboardModals';
import PlaidLinkModal from './PlaidLinkModal';
import { getUserChallenges, checkInChallenge, getUserTransactions } from '../api/axios';

interface DashboardProps {
  user: { name: string; photo: string };
  onSignOut: () => void;
}

interface UserChallenge {
  challengeId: string;
  status?: string;
  streak: number;
  lastCheckIn?: string;
  challengeTemplate: {
    title: string;
    description: string;
    ruleType: string;
    duration: number;
    difficulty: string;
  };
}

interface Transaction {
  transaction_id: string;
  amount: number;
  date: string;
  authorized_date?: string;
  merchant_name?: string;
  personal_finance_category?: {
    primary?: string;
    detailed?: string;
  };
  account_id: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut }) => {
  const [modal, setModal] = React.useState<null | 'join' | 'view' | 'link' | 'sync'>(null);
  const [plaidOpen, setPlaidOpen] = React.useState(false);
  const [userChallenges, setUserChallenges] = React.useState<UserChallenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = React.useState(true);
  const [checkingIn, setCheckingIn] = React.useState<string | null>(null);
  const [recentTransactions, setRecentTransactions] = React.useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = React.useState(true);

  // Debug: Log user data to see what we're receiving
  React.useEffect(() => {
    console.log('Dashboard user data:', user);
    console.log('User photo URL:', user.photo);
    console.log('Is user.photo truthy?', !!user.photo);
  }, [user]);

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
          // Only show active challenges on the main dashboard
          const activeChallenges = (response.data.challenges || []).filter(
            (challenge: UserChallenge) => challenge.status === 'active' || !challenge.status
          );
          setUserChallenges(activeChallenges);
        }
      } catch (err) {
        console.error('Failed to load user challenges:', err);
      } finally {
        setLoadingChallenges(false);
      }
    };
    loadUserChallenges();
  }, []);

  // Load recent transactions
  React.useEffect(() => {
    const loadRecentTransactions = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.log('No userId found for transactions');
        setLoadingTransactions(false);
        return;
      }
      
      console.log('Loading transactions for userId:', userId);
      
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const apiService = (await import('../api/axios')).default;
          apiService.setAuthToken(token);
        }
        const response = await getUserTransactions(userId);
        console.log('Transactions API response:', response);
        if (response.data.success) {
          console.log('Transactions loaded:', response.data.transactions);
          setRecentTransactions(response.data.transactions || []);
        } else {
          console.log('Transactions API returned success=false:', response.data);
        }
      } catch (err) {
        console.error('Failed to load transactions:', err);
      } finally {
        setLoadingTransactions(false);
      }
    };
    loadRecentTransactions();
  }, []);

  const formatTransactionDate = (transaction: Transaction) => {
    const date = transaction.authorized_date || transaction.date;
    return new Date(date).toLocaleDateString();
  };

  const formatTransactionAmount = (amount: number) => {
    return `$${Math.abs(amount).toFixed(2)}`;
  };

  const getTransactionDescription = (transaction: Transaction) => {
    const merchant = transaction.merchant_name || 'Unknown Merchant';
    const amount = formatTransactionAmount(transaction.amount);
    const date = formatTransactionDate(transaction);
    return `${merchant} ${amount} (${date})`;
  };

  const handleQuickCheckIn = async (challengeId: string, challengeTitle: string) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('User ID not found. Please sign in again.');
      return;
    }
    setCheckingIn(challengeId);
    try {
      const response = await checkInChallenge(userId, challengeId);
      if (response.status === 200) {
        alert(`Check-in successful for "${challengeTitle}"!`);
        // Refresh challenges
        const refreshResponse = await getUserChallenges(userId);
        if (refreshResponse.data.success) {
          const activeChallenges = (refreshResponse.data.challenges || []).filter(
            (challenge: UserChallenge) => challenge.status === 'active' || !challenge.status
          );
          setUserChallenges(activeChallenges);
        }
      }
    } catch (err: any) {
      const errorData = err?.response?.data;
      if (errorData?.challengeFailed) {
        alert(`Challenge "${challengeTitle}" has failed: ${errorData.message || 'Rule violation detected'}. You can rejoin in the View Challenges section.`);
      } else {
        alert(errorData?.message || 'Check-in failed.');
      }
      // Refresh challenges to get updated status
      try {
        const userId = localStorage.getItem('userId');
        if (userId) {
          const refreshResponse = await getUserChallenges(userId);
          if (refreshResponse.data.success) {
            const activeChallenges = (refreshResponse.data.challenges || []).filter(
              (challenge: UserChallenge) => challenge.status === 'active' || !challenge.status
            );
            setUserChallenges(activeChallenges);
          }
        }
      } catch (refreshErr) {
        console.error('Failed to refresh challenges:', refreshErr);
      }
    } finally {
      setCheckingIn(null);
    }
  };

  const openModal = (type: typeof modal) => {
    if (type === 'link') {
      setPlaidOpen(true);
    } else {
      setModal(type);
    }
  };
  // Close only the dashboard modal
  const closeModal = () => {
    setModal(null);
  };
  // Close only the Plaid modal
  const closePlaidModal = () => {
    setPlaidOpen(false);
  };

  return (
    <div style={styles.pageContainer as React.CSSProperties}>
      <header style={styles.appBar as React.CSSProperties}>
        <span style={styles.logo as React.CSSProperties}>SaveQuest</span>
        <div style={styles.profileRow as React.CSSProperties}>
          <img 
            src={user.photo || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM0Mjg1RjQiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik04IDhDMTAuMjA5MSA4IDEyIDYuMjA5MTQgMTIgNEMxMiAxLjc5MDg2IDEwLjIwOTEgMCA4IDBDNS43OTA4NiAwIDQgMS43OTA4NiA0IDRDNCA2LjIwOTE0IDUuNzkwODYgOCA4IDhaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTYgMTZWMTRDMTYgMTEuNzkwOSAxNC4yMDkxIDEwIDEyIDEwSDRDMS43OTA4NiAxMCAwIDExLjc5MDkgMCAxNFYxNkgxNloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4='} 
            alt="Profile" 
            style={styles.profileIcon as React.CSSProperties}
            onLoad={() => console.log('Header profile image loaded successfully:', user.photo)}
            onError={(e) => {
              console.log('Header profile image failed to load:', user.photo);
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM0Mjg1RjQiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik04IDhDMTAuMjA5MSA4IDEyIDYuMjA5MTQgMTIgNEMxMiAxLjc5MDg2IDEwLjIwOTEgMCA4IDBDNS43OTA4NiAwIDQgMS43OTA4NiA0IDRDNCA2LjIwOTE0IDUuNzkwODYgOCA4IDhaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTYgMTZWMTRDMTYgMTEuNzkwOSAxNC4yMDkxIDEwIDEyIDEwSDRDMS43OTA4NiAxMCAwIDExLjc5MDkgMCAxNFYxNkgxNloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4=';
            }}
          />
          <button onClick={onSignOut} style={styles.signOutBtn as React.CSSProperties}>Sign Out</button>
        </div>
      </header>
      <div style={styles.welcomeCard as React.CSSProperties}>
        <img 
          src={user.photo || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiM0Mjg1RjQiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTIwIDIwQzI1LjUyMjggMjAgMzAgMTUuNTIyOCAzMCAxMEMzMCA0LjQ3NzE1IDI1LjUyMjggMCAyMCAwQzE0LjQ3NzIgMCAxMCA0LjQ3NzE1IDEwIDEwQzEwIDE1LjUyMjggMTQuNDc3MiAyMCAyMCAyMFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik00MCA0MFYzNUM0MCAyOS40NzcyIDM1LjUyMjggMjUgMzAgMjVIMTBDNC40NzcxNSAyNSAwIDI5LjQ3NzIgMCAzNVY0MEg0MFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4='} 
          alt="Profile" 
          style={styles.welcomeProfileImg as React.CSSProperties}
          onLoad={() => console.log('Welcome profile image loaded successfully:', user.photo)}
          onError={(e) => {
            console.log('Welcome profile image failed to load:', user.photo);
            const target = e.target as HTMLImageElement;
            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiM0Mjg1RjQiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTIwIDIwQzI1LjUyMjggMjAgMzAgMTUuNTIyOCAzMCAxMEMzMCA0LjQ3NzE1IDI1LjUyMjggMCAyMCAwQzE0LjQ3NzIgMCAxMCA0LjQ3NzE1IDEwIDEwQzEwIDE1LjUyMjggMTQuNDc3MiAyMCAyMCAyMFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik00MCA0MFYzNUM0MCAyOS40NzcyIDM1LjUyMjggMjUgMzAgMjVIMTBDNC40NzcxNSAyNSAwIDI5LjQ3NzIgMCAzNVY0MEg0MFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4=';
          }}
        />
        <div>
          <div style={styles.welcomeTitle as React.CSSProperties}>Welcome, {user.name}!</div>
          <div style={styles.welcomeSubtitle as React.CSSProperties}>Glad to see you back!</div>
        </div>
      </div>
      <div style={styles.quickGrid as React.CSSProperties}>
        <button style={styles.quickBtn as React.CSSProperties} onClick={() => openModal('join')}>Join Challenge</button>
        <button style={styles.quickBtn as React.CSSProperties} onClick={() => openModal('view')}>View Challenges</button>
        <button style={styles.quickBtn as React.CSSProperties} onClick={() => openModal('link')}>Link Bank</button>
        <button style={styles.quickBtn as React.CSSProperties} onClick={() => openModal('sync')}>Sync Transactions</button>
      </div>
      <div style={styles.challengesSection as React.CSSProperties}>
        {loadingChallenges ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            Loading your challenges...
          </div>
        ) : userChallenges.length > 0 ? (
          userChallenges.map((challenge: UserChallenge, i: number) => (
            <div key={i} style={styles.challengeCardModern as React.CSSProperties}>
              <div style={styles.challengeName as React.CSSProperties}>{challenge.challengeTemplate.title}</div>
              <div style={styles.challengeStreak as React.CSSProperties}>Streak: <span style={styles.streakNum as React.CSSProperties}>{challenge.streak} 🔥</span></div>
              <button 
                style={{
                  ...styles.checkInBtn as React.CSSProperties,
                  cursor: checkingIn === challenge.challengeId ? 'not-allowed' : 'pointer',
                  opacity: checkingIn === challenge.challengeId ? 0.6 : 1
                }} 
                onClick={() => handleQuickCheckIn(challenge.challengeId, challenge.challengeTemplate.title)}
                disabled={checkingIn === challenge.challengeId}
              >
                {checkingIn === challenge.challengeId ? 'Checking in...' : 'Check In'}
              </button>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            No active challenges. <br />
            <button 
              style={{ 
                background: '#1976d2', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 6, 
                padding: '8px 16px', 
                marginTop: '10px',
                cursor: 'pointer'
              }}
              onClick={() => openModal('join')}
            >
              Join Your First Challenge
            </button>
          </div>
        )}
      </div>
      <div style={styles.activityCard as React.CSSProperties}>
        <div style={styles.activityTitle as React.CSSProperties}>Recent Activity</div>
        {(() => {
          console.log('Activity section - loadingTransactions:', loadingTransactions);
          console.log('Activity section - recentTransactions:', recentTransactions);
          console.log('Activity section - recentTransactions.length:', recentTransactions.length);
          
          if (loadingTransactions) {
            return (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                Loading transactions...
              </div>
            );
          } else if (recentTransactions.length > 0) {
            return (
              <ul style={styles.activityList as React.CSSProperties}>
                {recentTransactions.slice(0, 5).map((transaction: Transaction, i: number) => (
                  <li 
                    key={transaction.transaction_id} 
                    style={{ 
                      ...(styles.activityItem as React.CSSProperties), 
                      borderBottom: i !== Math.min(recentTransactions.length, 5) - 1 ? '1px solid #f0f0f0' : 'none' 
                    }}
                  >
                    {getTransactionDescription(transaction)}
                  </li>
                ))}
              </ul>
            );
          } else {
            return (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No recent transactions. <br />
                <button 
                  style={{ 
                    background: '#1976d2', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 6, 
                    padding: '8px 16px', 
                    marginTop: '10px',
                    cursor: 'pointer'
                  }}
                  onClick={() => openModal('sync')}
                >
                  Sync Transactions
                </button>
              </div>
            );
          }
        })(        )}
      </div>
      <DashboardModals modal={modal} closeModal={closeModal} />
      <PlaidLinkModal
        userId={localStorage.getItem('userId') || ''}
        open={plaidOpen}
        onClose={closePlaidModal}
        onSuccess={() => {
          setPlaidOpen(false);
          // Optionally show a success message or refresh data here
        }}
      />
    </div>
  );
};

export default Dashboard;
