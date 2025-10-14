"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";

export default function AuthWrapper({ children }) {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push(`/login?from=${pathname}`);
    }
  }, [isLoggedIn, pathname, router]);

  return <>{isLoggedIn && children}</>;
}
