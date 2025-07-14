import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from 'firebase/auth';
import apiService from '../api/axios';
import firebaseConfig from './firebaseConfig';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const FirebaseAuth: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const handleShowToken = async () => {
    if (user) {
      const idToken = await user.getIdToken();
      setToken(idToken);
      try {
        await navigator.clipboard.writeText(idToken);
        alert('Token copied to clipboard!');
      } catch {
        // Clipboard API may not be available
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        apiService.setAuthToken(token);
      } else {
        apiService.setAuthToken(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Token is set in onAuthStateChanged
    } catch (error) {
      alert('Sign-in failed.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      apiService.setAuthToken(null);
    } catch (error) {
      alert('Sign-out failed.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {user ? (
        <>
          <div>Welcome, {user.displayName}</div>
          <button onClick={handleSignOut}>Sign Out</button>
          <button onClick={handleShowToken} style={{ marginLeft: 8 }}>Show/Copy ID Token</button>
          {token && (
            <textarea
              value={token}
              readOnly
              style={{ width: '100%', height: 80, marginTop: 8 }}
            />
          )}
        </>
      ) : (
        <button onClick={handleSignIn}>Sign in with Google</button>
      )}
    </div>
  );
};

export default FirebaseAuth;
