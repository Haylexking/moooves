"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { LandingPage } from "@/components/landing/landing-page"
import { SplashScreen } from "@/components/ui/splash-screen"

export default function HomePage() {
  // Render the new landing page for everyone at the root URL
  return <LandingPage />
}