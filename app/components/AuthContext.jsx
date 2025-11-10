"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(0);
  const router = useRouter();
  const refreshTokenPromise = useRef(null); // Prevent multiple simultaneous refresh calls

  // Check if a token exists in localStorage on load
  useEffect(() => {
    checkLogin();
  }, []);
  const checkLogin = () => {
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
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchCredits = async () => {
      try {
        const res = await fetchWithAuth(`${BACKEND_URL}/user/me`);
        const data = await res.json();
        if (res.ok) {
          setCredits(data.credits);
        }
      } catch (error) {
        console.error("Failed to fetch credits", error);
      }
    };

    fetchCredits();
  }, [isLoggedIn]);

  // Refresh token function
  const refreshAccessToken = async () => {
    // If already refreshing, return the existing promise
    if (refreshTokenPromise.current) {
      return refreshTokenPromise.current;
    }

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      logout();
      throw new Error("No refresh token available");
    }

    // Create the refresh promise
    refreshTokenPromise.current = fetch(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.detail || "Failed to refresh token");
        }
        return res.json();
      })
      .then((data) => {
        localStorage.setItem("access_token", data.access_token);
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }
        return data.access_token;
      })
      .catch((error) => {
        console.error("Token refresh failed:", error);
        logout();
        throw error;
      })
      .finally(() => {
        // Clear the promise after completion
        refreshTokenPromise.current = null;
      });

    return refreshTokenPromise.current;
  };

  // Enhanced fetch with automatic token refresh
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("access_token");

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token || ""}`,
    };

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If token expired, try to refresh and retry
    if (response.status === 401) {
      try {
        const newToken = await refreshAccessToken();
        const retryHeaders = {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        };
        if (!(options.body instanceof FormData)) {
          retryHeaders["Content-Type"] = "application/json";
        }
        // Retry the request with new token
        return fetch(url, {
          ...options,
          headers: retryHeaders,
        });
      } catch (error) {
        return response; // Return original error response
      }
    }

    return response;
  };

  const login = (token, refreshToken, userData) => {
    localStorage.setItem("access_token", token);
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }
    setIsLoggedIn(true);
    if (userData) setUser(userData);
  };

  const logout = async () => {
    // Call backend logout to clear cookie
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout API call failed:", error);
    }

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsLoggedIn(false);
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        login,
        logout,
        credits,
        setCredits,
        fetchWithAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
