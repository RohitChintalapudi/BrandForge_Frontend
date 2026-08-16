import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (attempt = 1) => {
    try {
      const res = await api.get("/api/auth/me");
      setUser(res.data);
      setLoading(false);
    } catch {
      if (attempt <= 15) {
        await new Promise((r) => setTimeout(r, 2000));
        return fetchUser(attempt + 1);
      }
      setUser(null);
      setLoading(false);
    }
  };

  const logout = async () => {
    await api.post("/api/auth/logout");
    setUser(null);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
