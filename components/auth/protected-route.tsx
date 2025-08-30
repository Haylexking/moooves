"use client"

import type React from "react"

import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { SplashScreen } from "@/components/ui/splash-screen"

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ children, redirectTo = "/onboarding" }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  if (isLoading) {
    return <SplashScreen progress={0.5} />
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
