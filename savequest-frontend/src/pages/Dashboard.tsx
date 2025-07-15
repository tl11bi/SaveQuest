



import * as React from 'react';
import styles from './DashboardStyles';
import { challenges, activity } from './dashboardData';
import DashboardModals from './DashboardModals';
import PlaidLinkModal from './PlaidLinkModal';

interface DashboardProps {
  user: { name: string; photo: string };
  onSignOut: () => void;
}


const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut }) => {
  const [modal, setModal] = React.useState<null | 'join' | 'view' | 'link' | 'sync'>(null);
  const [plaidOpen, setPlaidOpen] = React.useState(false);

  const openModal = (type: typeof modal) => {
    if (type === 'link') {
      setPlaidOpen(true);
    } else {
      setModal(type);
    }
  };
  const closeModal = () => setModal(null);

  return (
    <div style={styles.pageContainer as React.CSSProperties}>
      <header style={styles.appBar as React.CSSProperties}>
        <span style={styles.logo as React.CSSProperties}>SaveQuest</span>
        <div style={styles.profileRow as React.CSSProperties}>
          <img src={user.photo} alt="Profile" style={styles.profileIcon as React.CSSProperties} />
          <button onClick={onSignOut} style={styles.signOutBtn as React.CSSProperties}>Sign Out</button>
        </div>
      </header>
      <div style={styles.welcomeCard as React.CSSProperties}>
        <img src={user.photo} alt="Profile" style={styles.welcomeProfileImg as React.CSSProperties} />
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
        userId={user.name}
        open={plaidOpen}
        onClose={() => setPlaidOpen(false)}
        onSuccess={() => {
          setPlaidOpen(false);
          // Optionally show a success message or refresh data here
        }}
      />
    </div>
  );
};

export default Dashboard;
