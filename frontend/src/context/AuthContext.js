import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { securePost } from "@/utils/secureApi";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(data);
    } catch {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (email, password) => {
    // Admin login uses securePost too
    const data = await securePost("/auth/login", { email, password });
    setUser(data);
    return data;
  };

  const magicLogin = async (email, language = "en") => {
    const data = await securePost("/auth/magic", { email, language });
    return data;
  };

  const verifyMagicLink = async (token) => {
    // Verify uses securePost
    const data = await securePost("/auth/magic/verify", { token });
    setUser(data);
    return data;
  };

  const logout = async () => {
    await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, magicLogin, verifyMagicLink, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
