"use client"

import { useEffect } from "react"
import { useRouter, redirect } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { LandingPage } from "@/components/landing/landing-page"
import { SplashScreen } from "@/components/ui/splash-screen"

// Redirect all root traffic to onboarding
export default function HomePage() {
  redirect("/onboarding");
  return null;
}
