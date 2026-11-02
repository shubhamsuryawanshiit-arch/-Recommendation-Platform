import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false);
  useEffect(() => {
    const expired = () => setUser(null);
    window.addEventListener('watchwise:session-expired', expired);
    api.get('/auth/me').then(({ data }) => setUser(data.user)).catch(() => setUser(null)).finally(() => setReady(true));
    return () => window.removeEventListener('watchwise:session-expired', expired);
  }, []);
  const signIn = ({ user: profile }) => setUser(profile);
  const signOut = async () => { try { await api.post('/auth/logout'); } catch {} setUser(null); };
  return <AuthContext.Provider value={{ user, ready, signIn, signOut, refresh: async () => { const { data } = await api.get('/auth/me'); setUser(data.user); } }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
