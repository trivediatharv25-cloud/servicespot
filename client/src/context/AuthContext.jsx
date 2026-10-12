import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("servicespot_user");
    return stored ? JSON.parse(stored) : null;
  });
  // Set to true right after a successful login/register so a "Welcome" toast
  // can show once, then flips back to false a few seconds later.
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("servicespot_user", JSON.stringify(data));
    setUser(data);
    setJustLoggedIn(true);
    return data;
  };

  // Accepts the whole registration form object (name, email, password, role,
  // phone, location) instead of positional args - easier to extend later.
  const register = async (formData) => {
    const { data } = await api.post("/auth/register", formData);
    localStorage.setItem("servicespot_user", JSON.stringify(data));
    setUser(data);
    setJustLoggedIn(true);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("servicespot_user");
    setUser(null);
  };

  // Used from the dashboard to add/fix contact info (phone, location) after
  // signup - merges into the existing session data (token stays the same).
  const updateProfile = async (fields) => {
    const { data } = await api.patch("/auth/me", fields);
    const merged = { ...user, ...data };
    localStorage.setItem("servicespot_user", JSON.stringify(merged));
    setUser(merged);
    return merged;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, justLoggedIn, setJustLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
