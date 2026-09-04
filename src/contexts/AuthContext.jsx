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
      return loadProfile(session.user);
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
    let profile = null;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, name, email, role, course, status, enrolled, progress, test_series_access')
        .eq('id', authUser.id)
        .maybeSingle();
      profile = data;
    } catch {
      profile = null;
    }

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

  const signUp = async (name, email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const base = name.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
    const suffix = Math.random().toString(36).slice(2, 6);
    const username = `${base}.${suffix}`;

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          username,
          name: name.trim(),
          profile_email: cleanEmail,
          role: 'student',
        },
      },
    });

    if (error) throw error;

    if (data?.session) {
      const u = {
        id: data.user.id,
        username,
        name: name.trim(),
        email: cleanEmail,
        role: 'student',
      };
      setUser(u);
      return { user: u, confirmed: true };
    }

    return { user: data?.user, confirmed: false };
  };

  const verifyEmailOtp = async (email, token, type = 'signup') => {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type,
    });
    if (error) throw error;
    if (data?.session) {
      let profile = null;
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, username, name, email, role, course, status, enrolled, progress, test_series_access')
          .eq('id', data.user.id)
          .maybeSingle();
        profile = profileData;
      } catch {
        profile = null;
      }
      setUser(profile || {
        id: data.user.id,
        username: data.user.user_metadata?.username,
        name: data.user.user_metadata?.name,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'student',
      });
    }
    return data?.session ? true : false;
  };

  const login = async (username, password) => {
    const email = username.includes('@') ? username : `${username}@lms.app`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, name, email, role, course, status, enrolled, progress, test_series_access')
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
    <AuthContext.Provider value={{ user, signUp, verifyEmailOtp, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
