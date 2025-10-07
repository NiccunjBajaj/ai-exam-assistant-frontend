// app/auth/success/AuthSuccessClient.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        localStorage.setItem("access_token", token);
        router.push("/");
      } catch (err) {
        setError("Failed to save authentication token");
        setTimeout(() => router.push("/login"), 2000);
      }
    } else {
      setError("No authentication token received");
      setTimeout(() => router.push("/login"), 2000);
    }
  }, [token, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-blue-900">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-red-500">{error}</p>
          <p className="text-gray-600 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-blue-900">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    </div>
  );
}
