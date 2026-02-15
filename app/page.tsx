"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { LandingPage } from "@/components/landing/landing-page"
import { SplashScreen } from "@/components/ui/splash-screen"

export default function HomePage() {
  const router = useRouter()
  const { user, isAuthenticated, rehydrated } = useAuthStore()

  useEffect(() => {
    // Wait for store to rehydrate before redirecting
    if (!rehydrated) return

    // Only redirect to onboarding if the user is not authenticated
    if (!isAuthenticated) {
      router.replace("/onboarding")
    }
  }, [isAuthenticated, rehydrated, router])

  // Optionally show a splash while the auth store rehydrates
  if (!rehydrated) return <SplashScreen progress={0.5} />

  // Render the landing page for authenticated users
  return <LandingPage />
}