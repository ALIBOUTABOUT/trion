import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const verifyAdminRole = async (userId: string | undefined): Promise<boolean> => {
    if (!userId) return false;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (error || !data) return false;
      return data.role === 'admin';
    } catch {
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const isAuthorized = await verifyAdminRole(currentUser.id);
        if (isMounted) setIsAdmin(isAuthorized);
      } else {
        setIsAdmin(false);
      }
      if (isMounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const isAuthorized = await verifyAdminRole(currentUser.id);
        if (isMounted) setIsAdmin(isAuthorized);
      } else {
        setIsAdmin(false);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const isAuthorized = await verifyAdminRole(data.user?.id);
    if (!isAuthorized) {
      await supabase.auth.signOut();
      throw new Error('هذا الحساب غير مصرح له بالدخول كمسؤول للمتجر');
    }

    setUser(data.user);
    setIsAdmin(true);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  return { user, isAdmin, loading, signIn, signOut };
}
