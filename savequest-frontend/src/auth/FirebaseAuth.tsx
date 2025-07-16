import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from 'firebase/auth';
import apiService from '../api/axios';
import firebaseConfig from './firebaseConfig';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

interface FirebaseAuthProps {
  onLogin: (user: { name: string; photo: string }) => void;
}

const FirebaseAuth: React.FC<FirebaseAuthProps> = ({ onLogin }) => {
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
        // Store user ID in localStorage for use in other components
        localStorage.setItem('userId', firebaseUser.uid);
        localStorage.setItem('token', token);
        
        // Debug: Log user profile information
        console.log('Firebase User Profile:', {
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          email: firebaseUser.email
        });

        // Save user profile to backend
        try {
          await fetch(`${import.meta.env.VITE_API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              providerId: firebaseUser.providerId,
              phoneNumber: firebaseUser.phoneNumber,
              emailVerified: firebaseUser.emailVerified,
            }),
          });
        } catch (err) {
          console.error('Failed to save user to backend:', err);
        }
        
        onLogin({
          name: firebaseUser.displayName || '',
          photo: firebaseUser.photoURL || '',
        });
      } else {
        apiService.setAuthToken(null);
        // Clear stored user data on sign out
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    // Add scopes to ensure we get profile information
    provider.addScope('profile');
    provider.addScope('email');
    try {
      const result = await signInWithPopup(auth, provider);
      // Force refresh to get updated profile info
      if (result.user) {
        await result.user.reload();
      }
      // Token is set in onAuthStateChanged
    } catch (error) {
      console.error('Sign-in error:', error);
      alert('Sign-in failed.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      apiService.setAuthToken(null);
      // Clear stored user data
      localStorage.removeItem('userId');
      localStorage.removeItem('token');
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ fontWeight: 700, fontSize: 28, marginBottom: 24, color: '#4285F4', letterSpacing: 1 }}>SaveQuest</div>
          <button
            onClick={handleSignIn}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#fff',
              color: '#444',
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: '12px 28px',
              fontSize: 16,
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(60,64,67,.08)',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 48 48" style={{ display: 'block' }}>
              <g>
                <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.64 2.09 30.18 0 24 0 14.82 0 6.71 5.48 2.69 13.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"/>
                <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.66 7.01l7.19 5.6C43.98 37.13 46.1 31.36 46.1 24.55z"/>
                <path fill="#FBBC05" d="M10.67 28.09c-1.13-3.36-1.13-6.98 0-10.34l-7.98-6.2C.89 15.09 0 19.36 0 24c0 4.64.89 8.91 2.69 12.45l7.98-6.2z"/>
                <path fill="#EA4335" d="M24 48c6.18 0 11.64-2.09 15.85-5.7l-7.19-5.6c-2.01 1.35-4.59 2.15-8.66 2.15-6.38 0-11.87-3.63-14.33-8.94l-7.98 6.2C6.71 42.52 14.82 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </g>
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FirebaseAuth;
