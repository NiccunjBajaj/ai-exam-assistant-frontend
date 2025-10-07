"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function AuthWrapper({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      const from = pathname;
      router.push(`/login?from=${from}`);
    }
  }, [pathname, router]);

  return <>{children}</>;
}
