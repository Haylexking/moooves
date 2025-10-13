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
       // After rehydration, mark the store as rehydrated so UI can wait for it
       onRehydrateStorage: () => (state) => {
         if (state && typeof state.setRehydrated === 'function') {
           state.setRehydrated(true)
         }
       },
    }),
    { name: "auth-store" },
  ),
)
if (process.env.NODE_ENV === "development") {
  useAuthStore.subscribe((state) => {
    // Defer import to avoid side-effects in production/test runners
    // eslint-disable-next-line global-require
    const { logDebug } = require('@/lib/hooks/use-debug-logger')
    logDebug('Auth', { state })
  })
}

// For debugging purposes
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  (window as any).useAuthStore = useAuthStore
}
