'use client';
import { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '@/firebaseConfig';
import { onAuthStateChanged, onIdTokenChanged, User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  );
  const [loading, setLoading] = useState(true);

  console.log('🔥 AuthProvider is mounted');

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

    return () => {
      console.log('🛑 Unsubscribing from Firebase Auth...');
      unsubscribeAuth();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
