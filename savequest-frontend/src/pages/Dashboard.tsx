



import * as React from 'react';
import styles from './DashboardStyles';
import { challenges, activity } from './dashboardData';
import { DashboardModals } from './DashboardModals';
import PlaidLinkModal from './PlaidLinkModal';

interface DashboardProps {
  user: { name: string; photo: string };
  onSignOut: () => void;
}


const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut }) => {
  const [modal, setModal] = React.useState<null | 'join' | 'view' | 'link' | 'sync'>(null);
  const [plaidOpen, setPlaidOpen] = React.useState(false);

  // Debug: Log user data to see what we're receiving
  React.useEffect(() => {
    console.log('Dashboard user data:', user);
    console.log('User photo URL:', user.photo);
    console.log('Is user.photo truthy?', !!user.photo);
  }, [user]);

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
        {challenges.map((c: { name: string; streak: number }, i: number) => (
          <div key={i} style={styles.challengeCardModern as React.CSSProperties}>
            <div style={styles.challengeName as React.CSSProperties}>{c.name}</div>
            <div style={styles.challengeStreak as React.CSSProperties}>Streak: <span style={styles.streakNum as React.CSSProperties}>{c.streak} 🔥</span></div>
            <button style={styles.checkInBtn as React.CSSProperties} onClick={() => openModal('view')}>Check In</button>
          </div>
        ))}
      </div>
      <div style={styles.activityCard as React.CSSProperties}>
        <div style={styles.activityTitle as React.CSSProperties}>Recent Activity</div>
        <ul style={styles.activityList as React.CSSProperties}>
          {activity.map((a: { desc: string }, i: number) => (
            <li key={i} style={{ ...(styles.activityItem as React.CSSProperties), borderBottom: i !== activity.length - 1 ? '1px solid #f0f0f0' : 'none' }}>{a.desc}</li>
          ))}
        </ul>
      </div>
      <nav style={styles.bottomNav as React.CSSProperties}>
        <button style={styles.navBtn as React.CSSProperties}>Home</button>
        <button style={styles.navBtn as React.CSSProperties}>Challenges</button>
        <button style={styles.navBtn as React.CSSProperties}>Transactions</button>
        <button style={styles.navBtn as React.CSSProperties}>Profile</button>
      </nav>
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
