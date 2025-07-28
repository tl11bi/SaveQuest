import * as React from 'react';
import styles from '../pages/DashboardStyles';

interface TabNavigationProps {
  activeTab: 'home' | 'challenges' | 'transactions' | 'profile';
  onTabChange: (tab: 'home' | 'challenges' | 'transactions' | 'profile') => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const getTabStyle = (tabName: string) => ({
    ...styles.navBtn as React.CSSProperties,
    color: activeTab === tabName ? '#1976d2' : '#666',
    fontWeight: activeTab === tabName ? 600 : 500,
    position: 'relative' as const,
  });

  return (
    <nav style={styles.bottomNav as React.CSSProperties}>
      <button 
        style={getTabStyle('home')} 
        onClick={() => onTabChange('home')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 18 }}>🏠</span>
          <span style={{ fontSize: 12 }}>Home</span>
        </div>
      </button>
      <button 
        style={getTabStyle('challenges')} 
        onClick={() => onTabChange('challenges')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 18 }}>🎯</span>
          <span style={{ fontSize: 12 }}>Challenges</span>
        </div>
      </button>
      <button 
        style={getTabStyle('transactions')} 
        onClick={() => onTabChange('transactions')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 18 }}>💳</span>
          <span style={{ fontSize: 12 }}>Transactions</span>
        </div>
      </button>
      <button 
        style={getTabStyle('profile')} 
        onClick={() => onTabChange('profile')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 18 }}>👤</span>
          <span style={{ fontSize: 12 }}>Profile</span>
        </div>
      </button>
    </nav>
  );
};

export default TabNavigation;
