import * as React from 'react';
import FirebaseAuth from './auth/FirebaseAuth';
import Dashboard from './pages/Dashboard';

function App() {
  // TODO: Replace with real auth state
  const isLoggedIn = true;
  return (
    <div>
      {isLoggedIn ? <Dashboard /> : <FirebaseAuth />}
    </div>
  );
}

export default App;
