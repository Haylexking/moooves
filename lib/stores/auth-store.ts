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
    }),
    { name: "auth-store" },
  ),
)
