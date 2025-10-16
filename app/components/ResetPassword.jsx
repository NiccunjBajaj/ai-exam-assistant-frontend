"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPassword() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token"); // Get token from URL

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Invalid or missing token");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Reset failed");

      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#161616] px-4">
      <div className="flex w-[70vw] justify-center max-w-5xl h-[70vh] relative overflow-hidden rounded-3xl shadow-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key="reset-password"
            initial={{ width: "35%", opacity: 0 }}
            animate={{ width: "65%", opacity: 1 }}
            exit={{ width: "35%", opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="bg-[#1e1e1e] text-white rounded-r-3xl p-[3vw] flex flex-col justify-center"
          >
            <h1 className="text-[3vw] text-[#ffe243] mb-[2vw] text-center">
              Reset Password
            </h1>

            {error && (
              <div className="bg-red-600/30 text-[#ffe243] px-4 py-2 rounded mb-3 text-sm text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-600/30 text-[#161616] px-4 py-2 rounded mb-3 text-sm text-center">
                {success}
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-4">
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-2 rounded bg-[#606060] outline-none"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 rounded bg-[#606060] outline-none"
              />

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-[#606060] hover:bg-[#ffe243] hover:text-[#161616] text-white py-2 rounded font-semibold transition-all ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>

            <p
              className="text-center text-sm mt-4 text-[#ffe243] cursor-pointer underline"
              onClick={() => router.push("/login")}
            >
              Back to Login
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
