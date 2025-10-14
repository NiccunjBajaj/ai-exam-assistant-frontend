"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Check if a token exists in localStorage on load
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      setIsLoggedIn(true);
      // Optional: decode user data from token
      try {
        const base64Url = token.split(".")[1];
        const decodedData = JSON.parse(atob(base64Url));
        setUser(decodedData);
      } catch {
        setUser(null);
      }
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("access_token", token);
    setIsLoggedIn(true);
    if (userData) setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setIsLoggedIn(false);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
