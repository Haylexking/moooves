"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function AuthCallback() {
  const router = useRouter();
  const { setToken, setUser, setIsAuthenticated } = useAuthStore.getState();

  useEffect(() => {
    // Parse query params from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const user = params.get("user");

    if (token) {
      setToken(token);
      setIsAuthenticated(true);
      // Optionally, parse user info if provided
      if (user) {
        try {
          setUser(JSON.parse(decodeURIComponent(user)));
        } catch (e) {
          // fallback: just set token
        }
      }
      router.replace("/dashboard");
    } else {
      // No token, redirect to login
      router.replace("/onboarding");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg font-bold text-green-800">Signing you in with Google...</div>
    </div>
  );
}
