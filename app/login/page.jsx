"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function LoginRegisterPage() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Login form
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  // Register form
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Forgot Password form
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  // Auto-redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const verifyToken = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) router.push("/");
        else localStorage.clear();
      } catch {
        localStorage.clear();
      }
    };
    verifyToken();
  }, []);

  // ---------------- Handlers ----------------

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      router.push("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (registerData.password.length < 6)
      return setError("Password must be at least 6 characters long");
    if (registerData.password !== registerData.confirmPassword)
      return setError("Passwords do not match");
    if (registerData.username.length < 2)
      return setError("Username must be at least 2 characters long");

    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerData.username,
          email: registerData.email,
          password: registerData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");

      // Auto-login after register
      const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
        }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok)
        throw new Error(loginData.detail || "Auto-login failed");

      localStorage.setItem("access_token", loginData.access_token);
      localStorage.setItem("refresh_token", loginData.refresh_token);
      router.push("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      alert(data.message);
      setShowForgot(false);
      setForgotEmail("");
    } catch (err) {
      setError("Something went wrong, please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#00141b] px-4">
      <div className="flex w-[70vw] justify-center max-w-5xl h-[70vh] relative overflow-hidden rounded-3xl shadow-lg">
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div
              key="login"
              initial={{ width: "65%", opacity: 0 }}
              animate={{ width: "65%", opacity: 1 }}
              exit={{ width: "35%", opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="bg-[#0B1E26] text-white rounded-r-3xl p-[3vw] flex flex-col justify-center"
            >
              <h1 className="text-[3vw] text-[#ffe655] mb-[2vw] font-[federo]">
                Learnee
              </h1>
              {error && (
                <div className="bg-red-600/30 text-[#ffe655] px-4 py-2 rounded mb-3 text-sm">
                  {error}
                </div>
              )}

              {showForgot ? (
                // -------- Forgot Password Form --------
                <form
                  onSubmit={handleForgotPassword}
                  className="space-y-4 flex flex-col"
                >
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded bg-[#606060] outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#F1E596] hover:bg-[#ffe655] text-[#00141b] py-2 rounded font-semibold"
                  >
                    Send Reset Link
                  </button>
                  <p
                    className="text-sm text-[#ffe655] mt-2 cursor-pointer underline"
                    onClick={() => setShowForgot(false)}
                  >
                    Back to login
                  </p>
                </form>
              ) : (
                // -------- Login Form --------
                <>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <input
                      type="email"
                      placeholder="Email"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 rounded bg-[#F1E596] outline-none text-[#00141b]"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 rounded bg-[#F1E596] outline-none text-[#00141b]"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span
                        className="text-sm text-[#e2e8f0] cursor-pointer underline"
                        onClick={() => setShowForgot(true)}
                      >
                        Forgot Password?
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full bg-[#F1E596] hover:bg-[#ffe655] text-[#00141b] py-2 rounded font-semibold transition-all ${
                        isLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {isLoading ? "Logging in..." : "Login"}
                    </button>
                  </form>

                  <div className="my-4 text-center text-[#e2e8f0]">or</div>
                  <div className="mx-auto w-fit">
                    <GoogleLoginButton />
                  </div>

                  <p className="text-center text-sm mt-4 text-[#e2e8f0]">
                    Don’t have an account?{" "}
                    <span
                      onClick={() => setIsLogin(false)}
                      className="cursor-pointer underline"
                    >
                      Sign up
                    </span>
                  </p>
                </>
              )}
            </motion.div>
          ) : (
            // -------- Sign Up Form (unchanged) --------
            <motion.div
              key="signup"
              initial={{ width: "35%", opacity: 0 }}
              animate={{ width: "65%", opacity: 1 }}
              exit={{ width: "35%", opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="bg-[#e2e8f0] text-[#00141b] rounded-r-3xl p-[3vw] flex flex-col justify-center"
            >
              <h1 className="text-[2.5vw] font-semibold mb-[1vw]">
                Create Account
              </h1>
              {error && (
                <div className="bg-red-600/30 text-[#00141b] px-4 py-2 rounded mb-3 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4 mt-[1vw]">
                <input
                  type="text"
                  placeholder="Username"
                  value={registerData.username}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      username: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2 rounded bg-[#e2e8f0] outline-none"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={registerData.email}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, email: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 rounded bg-[#e2e8f0] outline-none"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      password: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2 rounded bg-[#e2e8f0] outline-none"
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2 rounded bg-[#e2e8f0] outline-none"
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-[#F1E596] hover:bg-[#ffe655] text-[#00141b] py-2 rounded font-semibold transition-all ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? "Creating account..." : "Sign Up"}
                </button>
              </form>

              <div className="my-4 text-center text-[#00141b]">or</div>
              <div className="mx-auto w-fit">
                <GoogleLoginButton />
              </div>

              <p className="text-center text-sm mt-4 text-[#00141b]">
                Already have an account?{" "}
                <span
                  onClick={() => setIsLogin(true)}
                  className="cursor-pointer underline"
                >
                  Login
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
