import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "./supabase/client";

type AuthContextType = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: any;
  login: (password: string) => boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loginAsUser: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_PASSWORD = import.meta.env["VITE_ADMIN_PASSWORD"];

if (!ADMIN_PASSWORD) {
  throw new Error("VITE_ADMIN_PASSWORD environment variable is not set. Please set it in your .env file.");
}
const AUTH_KEY = "owo-tea:auth";
const AUTH_TYPE_KEY = "owo-tea:auth-type";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check localStorage for existing auth
    const storedAuth = localStorage.getItem(AUTH_KEY);
    const storedType = localStorage.getItem(AUTH_TYPE_KEY);
    if (storedAuth === "true") {
      setIsAuthenticated(true);
      setIsAdmin(storedType === "admin");
    }

    // Check Supabase auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsAuthenticated(true);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsAuthenticated(true);
      } else {
        // Only set to false if not using localStorage auth
        const localAuth = localStorage.getItem(AUTH_KEY);
        if (!localAuth) {
          setIsAuthenticated(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (password: string): boolean => {
    // Admin login with local password
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(AUTH_KEY, "true");
      localStorage.setItem(AUTH_TYPE_KEY, "admin");
      setIsAuthenticated(true);
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Check if user is admin (you can add a user_roles table or use metadata)
      const isAdminUser = email.includes('admin') || email.includes('owner');
      
      setUser(data.user);
      setIsAuthenticated(true);
      setIsAdmin(isAdminUser);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const loginAsUser = () => {
    localStorage.setItem(AUTH_KEY, "true");
    localStorage.setItem(AUTH_TYPE_KEY, "user");
    setIsAuthenticated(true);
    setIsAdmin(false);
  };

  const logout = async () => {
    // Clear localStorage auth
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_TYPE_KEY);
    setIsAuthenticated(false);
    setIsAdmin(false);

    // Sign out from Supabase
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, user, login, loginWithEmail, logout, loginAsUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
