import * as React from 'react';
import FirebaseAuth from './auth/FirebaseAuth';
import Dashboard from './pages/Dashboard';


import { useState } from 'react';

import { getAuth, signOut } from 'firebase/auth';

type UserInfo = { name: string; photo: string } | null;

function App() {
  const [user, setUser] = React.useState<UserInfo>(null);

  const handleSignOut = async () => {
    const auth = getAuth();
    await signOut(auth);
    setUser(null);
  };

  return (
    <div>
      {user ? (
        <Dashboard user={user} onSignOut={handleSignOut} />
      ) : (
        <FirebaseAuth onLogin={setUser} />
      )}
    </div>
  );
}

export default App;
