import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: 'admin' | 'guru' | null;
  className: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<'admin' | 'guru' | null>(null);
  const [className, setClassName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Helper to fetch role
    const fetchRole = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('role, class_name')
        .eq('id', userId)
        .single();

      if (data) {
        setRole(data.role as 'admin' | 'guru');
        setClassName(data.class_name);
      } else {
        setRole(null); // Default or fallback
        setClassName(null);
      }
    };

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchRole(session.user.id).then(() => setLoading(false));
      } else {
        setRole(null);
        setClassName(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setClassName(null);
  };

  const value = {
    user,
    session,
    role,
    className,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
