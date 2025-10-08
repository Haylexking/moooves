"use client";
export const dynamic = "force-dynamic"
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function AuthCallback() {
  const router = useRouter();
  const { setToken, setUser, setIsAuthenticated } = useAuthStore.getState();

  useEffect(() => {
    let code: string | null = null
    let type: string | null = null
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search)
      code = sp.get("code")
      type = sp.get("type")
    }

    if (!code || !type) {
      router.replace("/onboarding");
      return;
    }

    const endpoint =
      type === "host"
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/host/auth/google/login?code=${code}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google/login?code=${code}`;

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        if (data?.token) {
          setToken(data.token);
          setIsAuthenticated(true);
          setUser(data.data);
          if (type === "host") {
            router.replace("/host-dashboard");
          } else {
            router.replace("/dashboard");
          }
        } else {
          router.replace(type === "host" ? "/host" : "/onboarding");
        }
      })
      .catch(() => router.replace(type === "host" ? "/host" : "/onboarding"));
  }, [router, setToken, setUser, setIsAuthenticated]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg font-bold text-green-800">
        Signing you in with Google...
      </div>
    </div>
  );
}