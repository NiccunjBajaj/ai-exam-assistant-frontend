// app/auth/success/AuthSuccessClient.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const refreshToken = searchParams.get("refresh_token");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        localStorage.setItem("access_token", token);
        if (refreshToken) {
          localStorage.setItem("refresh_token", refreshToken);
        }
        router.push("/");
      } catch (err) {
        setError("Failed to save authentication token");
        setTimeout(() => router.push("/login"), 2000);
      }
    } else {
      setError("No authentication token received");
      setTimeout(() => router.push("/login"), 2000);
    }
  }, [token, refreshToken, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#00141b]">
        <div className="bg-[#e2e8f0] p-8 rounded-lg shadow-lg">
          <p className="text-red-500">{error}</p>
          <p className="text-gray-600 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#00141b]">
      <div className="bg-[#e2e8f0] p-8 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    </div>
  );
}
