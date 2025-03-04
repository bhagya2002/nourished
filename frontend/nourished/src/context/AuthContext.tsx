'use client';
import { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '@/firebaseConfig';
import { onAuthStateChanged, onIdTokenChanged, User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  );
  const [loading, setLoading] = useState(true);

  console.log('🔥 AuthProvider is mounted');

  const refreshToken = async (): Promise<string | null> => {
    if (!user) return null;
    
    try {
      console.log('🔄 Manually refreshing token...');
      const newToken = await user.getIdToken(true);
      setToken(newToken);
      localStorage.setItem('authToken', newToken);
      console.log('✅ Token refreshed successfully');
      return newToken;
    } catch (error) {
      console.error('❌ Failed to refresh token:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('🛠 Listening for Firebase Auth changes...');

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('📌 Auth state changed:', firebaseUser);
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        setUser(firebaseUser);
        setToken(idToken);
        localStorage.setItem('authToken', idToken);
        console.log('User is authenticated:', firebaseUser.email);
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
        console.log('❌ No user found, setting user to null.');
      }
      setLoading(false);
    });

    const unsubscribeToken = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          console.log('🔄 Token changed, updating...');
          const newToken = await firebaseUser.getIdToken();
          setToken(newToken);
          localStorage.setItem('authToken', newToken);
        } catch (error) {
          console.error('❌ Failed to get new token:', error);
        }
      }
    });

    return () => {
      console.log('🛑 Unsubscribing from Firebase Auth...');
      unsubscribeAuth();
      unsubscribeToken();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
