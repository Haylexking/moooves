"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function AuthCallback() {
  const router = useRouter();
  const { setToken, setUser, setIsAuthenticated } = useAuthStore.getState();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      router.replace("/onboarding"); // No code, fallback
      return;
    }

    // Exchange code for JWT + user
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/host/auth/google/login?code=${code}`)
      .then(res => res.json())
      .then(data => {
        if (data?.token) {
          setToken(data.token);
          setIsAuthenticated(true);
          setUser(data.data);
          router.replace("/dashboard");
        } else {
          router.replace("/onboarding");
        }
      })
      .catch(() => router.replace("/onboarding"));
  }, [router, setToken, setUser, setIsAuthenticated]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg font-bold text-green-800">Signing you in with Google...</div>
    </div>
  );
}