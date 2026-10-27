import { createContext, useContext, useState, type ReactNode } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem("auth_user");

    if (!savedUser) return null;

    try {
      return JSON.parse(savedUser) as AuthUser;
    } catch {
      localStorage.removeItem("auth_user");
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("auth_token"),
  );

  function login(user: AuthUser, token: string) {
    localStorage.setItem("auth_user", JSON.stringify(user));
    localStorage.setItem("auth_token", token);

    setUser(user);
    setToken(token);
  }

  function logout() {
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");

    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
