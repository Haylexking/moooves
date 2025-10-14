"use client"

import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import type { AuthSlice } from "./slices/auth-slice"
import { createAuthSlice } from "./slices/auth-slice"

export const useAuthStore = create<AuthSlice>()(
  devtools(
    persist(createAuthSlice, {
      name: "moooves-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && typeof state.setRehydrated === "function") {
          state.setRehydrated(true)
        }
      },
    }),
    { name: "auth-store" },
  ),
)

if (process.env.NODE_ENV === "development") {
  useAuthStore.subscribe((state) => {
    const { logDebug } = require("@/lib/hooks/use-debug-logger")
    logDebug("Auth", { state })
  })
}

// For debugging purposes
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  ;(window as any).useAuthStore = useAuthStore
}
