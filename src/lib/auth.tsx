import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type AuthContextType = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (password: string) => boolean;
  logout: () => void;
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

  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_KEY);
    const storedType = localStorage.getItem(AUTH_TYPE_KEY);
    if (storedAuth === "true") {
      setIsAuthenticated(true);
      setIsAdmin(storedType === "admin");
    }
  }, []);

  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(AUTH_KEY, "true");
      localStorage.setItem(AUTH_TYPE_KEY, "admin");
      setIsAuthenticated(true);
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const loginAsUser = () => {
    localStorage.setItem(AUTH_KEY, "true");
    localStorage.setItem(AUTH_TYPE_KEY, "user");
    setIsAuthenticated(true);
    setIsAdmin(false);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_TYPE_KEY);
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, login, logout, loginAsUser }}>
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
