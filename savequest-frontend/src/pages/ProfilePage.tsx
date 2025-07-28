import * as React from 'react';
import styles from './DashboardStyles';

interface ProfilePageProps {
  user: { name: string; photo: string };
  onSignOut: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onSignOut }) => {
  const [userStats, setUserStats] = React.useState({
    totalChallenges: 0,
    activeChallenges: 0,
    completedChallenges: 0,
    totalStreak: 0,
  });

  React.useEffect(() => {
    // Load user statistics
    const loadUserStats = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      try {
        const token = localStorage.getItem('token');
        if (token) {
          const apiService = (await import('../api/axios')).default;
          apiService.setAuthToken(token);
        }
        
        const { getUserChallenges } = await import('../api/axios');
        const response = await getUserChallenges(userId);
        
        if (response.data.success) {
          const challenges = response.data.challenges || [];
          const activeChallenges = challenges.filter((c: any) => (c.status || 'active').toLowerCase() === 'active');
          const completedChallenges = challenges.filter((c: any) => (c.status || '').toLowerCase() === 'completed');
          const totalStreak = challenges.reduce((sum: number, c: any) => sum + (c.streak || 0), 0);

          setUserStats({
            totalChallenges: challenges.length,
            activeChallenges: activeChallenges.length,
            completedChallenges: completedChallenges.length,
            totalStreak,
          });
        }
      } catch (err) {
        console.error('Failed to load user stats:', err);
      }
    };
    
    loadUserStats();
  }, []);

  const statsCardStyle = {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    border: '1px solid #e0e0e0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  };

  const statItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0',
  };

  const settingItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
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
          />
        </div>
      </header>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#333' }}>Profile</h1>
        <p style={{ color: '#666', fontSize: 16, marginBottom: 20 }}>Manage your account and view your progress</p>
      </div>

      {/* Profile Info */}
      <div style={statsCardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <img 
            src={user.photo || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiM0Mjg1RjQiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTIwIDIwQzI1LjUyMjggMjAgMzAgMTUuNTIyOCAzMCAxMEMzMCA0LjQ3NzE1IDI1LjUyMjggMCAyMCAwQzE0LjQ3NzIgMCAxMCA0LjQ3NzE1IDEwIDEwQzEwIDE1LjUyMjggMTQuNDc3MiAyMCAyMCAyMFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik00MCA0MFYzNUM0MCAyOS40NzcyIDM1LjUyMjggMjUgMzAgMjVIMTBDNC40NzcxNSAyNSAwIDI5LjQ3NzIgMCAzNVY0MEg0MFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4='} 
            alt="Profile" 
            style={{ width: 80, height: 80, borderRadius: '50%', marginRight: 16 }}
          />
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: '#333' }}>{user.name}</h2>
            <p style={{ color: '#666', fontSize: 14 }}>SaveQuest Member</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={statsCardStyle}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#333' }}>Your Stats</h3>
        
        <div style={{ ...statItemStyle, borderBottom: 'none' }}>
          <span style={{ fontSize: 14, color: '#666' }}>Total Challenges</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>{userStats.totalChallenges}</span>
        </div>
        
        <div style={statItemStyle}>
          <span style={{ fontSize: 14, color: '#666' }}>Active Challenges</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#4caf50' }}>{userStats.activeChallenges}</span>
        </div>
        
        <div style={statItemStyle}>
          <span style={{ fontSize: 14, color: '#666' }}>Completed Challenges</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#2196f3' }}>{userStats.completedChallenges}</span>
        </div>
        
        <div style={{ ...statItemStyle, borderBottom: 'none' }}>
          <span style={{ fontSize: 14, color: '#666' }}>Total Streak Days</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#ff9800' }}>{userStats.totalStreak} 🔥</span>
        </div>
      </div>

      {/* Settings */}
      <div style={statsCardStyle}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#333' }}>Settings</h3>
        
        <div style={settingItemStyle} onClick={() => console.log('Sync transactions')}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#333' }}>Sync Transactions</div>
            <div style={{ fontSize: 13, color: '#666' }}>Update your latest transaction data</div>
          </div>
          <span style={{ fontSize: 18, color: '#666' }}>→</span>
        </div>
        
        <div style={settingItemStyle} onClick={() => console.log('Link bank account')}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#333' }}>Link Bank Account</div>
            <div style={{ fontSize: 13, color: '#666' }}>Connect your financial accounts</div>
          </div>
          <span style={{ fontSize: 18, color: '#666' }}>→</span>
        </div>
        
        <div style={settingItemStyle} onClick={() => console.log('Notifications')}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#333' }}>Notifications</div>
            <div style={{ fontSize: 13, color: '#666' }}>Manage your notification preferences</div>
          </div>
          <span style={{ fontSize: 18, color: '#666' }}>→</span>
        </div>
        
        <div style={settingItemStyle} onClick={() => console.log('Privacy')}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#333' }}>Privacy & Security</div>
            <div style={{ fontSize: 13, color: '#666' }}>Review your privacy settings</div>
          </div>
          <span style={{ fontSize: 18, color: '#666' }}>→</span>
        </div>
        
        <div style={{ ...settingItemStyle, borderBottom: 'none' }} onClick={() => console.log('Help')}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#333' }}>Help & Support</div>
            <div style={{ fontSize: 13, color: '#666' }}>Get help or contact support</div>
          </div>
          <span style={{ fontSize: 18, color: '#666' }}>→</span>
        </div>
      </div>

      {/* Sign Out */}
      <div style={{ marginBottom: 80 }}>
        <button 
          onClick={onSignOut}
          style={{ 
            background: '#f44336', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 8, 
            padding: '16px 24px', 
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
