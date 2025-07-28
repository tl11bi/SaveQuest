import * as React from 'react';
import Dashboard from './Dashboard';
import ChallengesPage from './ChallengesPage';
import TransactionsPage from './TransactionsPage';
import ProfilePage from './ProfilePage';
import TabNavigation from '../components/TabNavigation';

interface MainAppProps {
  user: { name: string; photo: string };
  onSignOut: () => void;
}

type TabType = 'home' | 'challenges' | 'transactions' | 'profile';

const MainApp: React.FC<MainAppProps> = ({ user, onSignOut }) => {
  const [activeTab, setActiveTab] = React.useState<TabType>('home');

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard user={user} onSignOut={onSignOut} />;
      case 'challenges':
        return <ChallengesPage user={user} />;
      case 'transactions':
        return <TransactionsPage user={user} />;
      case 'profile':
        return <ProfilePage user={user} onSignOut={onSignOut} />;
      default:
        return <Dashboard user={user} onSignOut={onSignOut} />;
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {renderActiveTab()}
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default MainApp;
