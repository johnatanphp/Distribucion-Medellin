import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User } from "@workspace/api-client-react";
import { getAuthUser, setAuthUser as saveAuthUser, clearAuth, getAuthToken } from "@/lib/auth";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  setUser: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(getAuthUser());
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [, setLocation] = useLocation();

  useEffect(() => {
    const currentToken = getAuthToken();
    const currentUser = getAuthUser();
    if (currentToken && currentUser) {
      setToken(currentToken);
      setUserState(currentUser);
    }
  }, []);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      saveAuthUser(newUser);
    } else {
      clearAuth();
      setToken(null);
    }
  };

  const logout = () => {
    clearAuth();
    setUserState(null);
    setToken(null);
    setLocation("/");
  };

  return (
    <AuthContext.Provider value={{ user, token, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
