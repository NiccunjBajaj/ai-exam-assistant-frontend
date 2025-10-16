"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyPage() {
  BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const search = useSearchParams();
  const token = search.get("token");
  const router = useRouter();
  const [status, setStatus] = useState("pending");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMsg("Invalid verification link");
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/auth/verify-email?token=${token}`
        );
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMsg("Email verified! Redirecting to login...");
          setTimeout(() => router.push("/login"), 2000);
        } else {
          setStatus("error");
          setMsg(data.detail || "Verification failed");
        }
      } catch (err) {
        setStatus("error");
        setMsg("Network error, please try again.");
      }
    };
    verifyEmail();
  }, [token]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#161616] text-white">
      <div className="p-8 rounded-2xl bg-[#1e1e1e] text-center max-w-md">
        {status === "pending" && <p>Verifying your email...</p>}
        {status === "success" && (
          <>
            <h2 className="text-2xl font-semibold text-[#ffe243]">
              Success ✅
            </h2>
            <p className="mt-4">{msg}</p>
          </>
        )}
        {status === "error" && (
          <>
            <h2 className="text-2xl font-semibold text-red-400">Error ❌</h2>
            <p className="mt-4">{msg}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 bg-[#ffe243] text-[#161616] px-4 py-2 rounded-lg font-semibold"
            >
              Go Home
            </button>
          </>
        )}
      </div>
    </main>
  );
}
