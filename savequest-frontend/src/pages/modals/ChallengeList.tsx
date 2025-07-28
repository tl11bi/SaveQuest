import React from 'react';
import ChallengeCard from './ChallengeCard';
import { UserChallenge } from './ViewChallengesModal';

interface ChallengeListProps {
  userChallenges: UserChallenge[];
  checkingIn: boolean;
  onCheckIn: (challengeId: string, challengeTitle: string) => void;
  onRejoin?: (challengeId: string, challengeTitle: string) => void;
}

const ChallengeList: React.FC<ChallengeListProps> = ({ userChallenges, checkingIn, onCheckIn, onRejoin }) => (
  <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: 16 }}>
    {userChallenges.map((userChallenge) => (
      <ChallengeCard
        key={userChallenge.userChallengeId}
        userChallenge={userChallenge}
        checkingIn={checkingIn}
        onCheckIn={onCheckIn}
        onRejoin={onRejoin}
      />
    ))}
  </div>
);

export default ChallengeList;
