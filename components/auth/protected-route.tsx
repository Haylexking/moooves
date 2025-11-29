"use client"

import type React from "react"

import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { SplashScreen } from "@/components/ui/splash-screen"

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  allowUnverified?: boolean
}

export function ProtectedRoute({ children, redirectTo = "/onboarding", allowUnverified = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, rehydrated, user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!rehydrated || isLoading) return
    if (isAuthenticated) {
      if (!allowUnverified && user && user.emailVerified === false) {
        try {
          const target = `${window.location.pathname}${window.location.search}${window.location.hash}`
          localStorage.setItem("return_to", target)
        } catch { }
        router.replace("/auth/verify")
        return
      }
      return
    }
    router.replace(redirectTo)
  }, [allowUnverified, isAuthenticated, isLoading, rehydrated, router, redirectTo, user?.emailVerified])

  // Separate effect for data sync to avoid infinite loop with isLoading
  useEffect(() => {
    if (rehydrated && isAuthenticated) {
      useAuthStore.getState().refreshUser()
    }
  }, [rehydrated, isAuthenticated])

  // If the persisted store hasn't rehydrated, show a splash to avoid blank screens
  if (!rehydrated || isLoading) {
    return <SplashScreen progress={0.5} />
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
