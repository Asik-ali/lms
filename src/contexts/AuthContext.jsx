import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session?.user) {
        setLoading(false);
        return;
      }
      loadProfile(session.user);
    }).catch(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(authUser) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, name, email, role, course, status, enrolled, progress')
      .eq('id', authUser.id)
      .single();

    if (profile) {
      setUser({ ...profile, id: profile.id });
    } else {
      const meta = authUser.user_metadata || {};
      setUser({
        id: authUser.id,
        username: meta.username || authUser.email?.split('@')[0],
        name: meta.name || authUser.email?.split('@')[0],
        email: authUser.email,
        role: meta.role || 'student',
      });
    }
    setLoading(false);
  }

  const login = async (username, password) => {
    const email = username.includes('@') ? username : `${username}@lms.app`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, name, email, role, course, status, enrolled, progress')
      .eq('id', data.user.id)
      .single();

    const u = profile || {
      id: data.user.id,
      username: data.user.user_metadata?.username || username,
      name: data.user.user_metadata?.name || username,
      email: data.user.email,
      role: data.user.user_metadata?.role || 'student',
    };
    setUser(u);
    return u;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
