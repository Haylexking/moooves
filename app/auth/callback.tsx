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
    const role = params.get("role"); // 👈 add role=user|host in query when redirecting

    if (!code || !role) {
      router.replace("/onboarding");
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const endpoint =
      role === "host"
        ? `${baseUrl}/host/auth/google/login?code=${code}`
        : `${baseUrl}/users/auth/google/login?code=${code}`;

    fetch(endpoint, { method: "POST" })
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
      <div className="text-lg font-bold text-green-800">
        Signing you in with Google...
      </div>
    </div>
  );
}