import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { captureSDKSession, getBread, normalizeUser, signOut, withTimeout } from '../lib/backend';
import type { User } from '../lib/types';
import { errorMessage } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

type AuthValue = {
  user: User | null;
  loading: boolean;
  sessionError: string;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, church: string) => Promise<void>;
  logout: () => Promise<void>;
};
const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  useEffect(() => {
    let alive = true;
    // A previous demo marker never grants access to the cloud application.
    if (localStorage.getItem('pv.session') !== 'cloud') {
      localStorage.removeItem('pv.session');
      setLoading(false);
      return;
    }
    getBread()
      .then((bread) => withTimeout(bread.auth.me()))
      .then((result) => {
        if (alive) setUser(normalizeUser(result));
      })
      .catch((error) => {
        if (alive) setSessionError(errorMessage(error));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  const login = async (email: string, password: string) => {
    const bread = await getBread();
    const result = await captureSDKSession(() => withTimeout(bread.auth.login(email.trim(), password)));
    let account: User;
    try {
      account = normalizeUser(result);
    } catch {
      account = normalizeUser(await withTimeout(bread.auth.me()));
    }
    localStorage.setItem('pv.session', 'cloud');
    setSessionError('');
    setUser(account);
  };
  const signup = async (email: string, password: string, name: string, church: string) => {
    const bread = await getBread();
    await captureSDKSession(() => withTimeout(bread.auth.signup(email.trim(), password)));
    try {
      const result = await captureSDKSession(() => withTimeout(bread.auth.login(email.trim(), password)));
      let account: User;
      try {
        account = normalizeUser(result);
      } catch {
        account = normalizeUser(await withTimeout(bread.auth.me()));
      }
      // These values seed the backend workspace, not a device-only profile.
      account.name = name.trim();
      account.churchName = church.trim();
      localStorage.setItem('pv.session', 'cloud');
      setSessionError('');
      setUser(account);
    } catch (error) {
      throw new Error(
        `Your account was created, but we couldn’t sign you in. Check your email for any verification request, then sign in. ${errorMessage(error)}`,
      );
    }
  };
  const logout = async () => {
    await signOut();
    navigate('/login', { replace: true });
    setUser(null);
    setSessionError('');
  };
  return (
    <AuthContext.Provider value={{ user, loading, sessionError, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}
