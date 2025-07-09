import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("token"));
  const [userId, setUserId] = useState(() => localStorage.getItem("user_id"));

  const login = (token, user_id) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user_id", String(user_id));
    setAuthToken(token);
    setUserId(user_id);
    console.log("✅ login() guardó el token:", token); // 👈 Log importante
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    setAuthToken(null);
    setUserId(null);
    console.log("🔒 Sesión cerrada"); // 👈 Log útil
  };

  // 👇 Verifica carga inicial desde localStorage
  useEffect(() => {
    console.log("🪪 AuthContext - token inicial:", authToken);
    console.log("🧑‍🦱 AuthContext - user_id inicial:", userId);
  }, []);

  return (
    <AuthContext.Provider value={{ authToken, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);