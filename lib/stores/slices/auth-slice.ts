import type { StateCreator } from "zustand"
import type { User } from "@/lib/types"
import { apiClient } from "@/lib/api/client"

export interface AuthSlice {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (fullName: string, email: string, password: string, phone?: string) => Promise<void>
  verifyEmail: (code: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })

    try {
      const response = await apiClient.login(email, password)

      if (response.success && response.data) {
        apiClient.setToken(response.data.token)
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        set({
          error: response.error || "Login failed",
          isLoading: false,
        })
      }
    } catch (error) {
      set({
        error: "Network error occurred",
        isLoading: false,
      })
    }
  },

  register: async (fullName: string, email: string, password: string, phone?: string) => {
    set({ isLoading: true, error: null })

    try {
      const response = await apiClient.register(fullName, email, password, phone)

      if (response.success && response.data) {
        apiClient.setToken(response.data.token)
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        set({
          error: response.error || "Registration failed",
          isLoading: false,
        })
      }
    } catch (error) {
      set({
        error: "Network error occurred",
        isLoading: false,
      })
    }
  },

  verifyEmail: async (code: string) => {
    set({ isLoading: true, error: null })

    try {
      const response = await apiClient.verifyEmail(code)

      if (response.success) {
        // Update user verification status
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, emailVerified: true },
            isLoading: false,
          })
        }
      } else {
        set({
          error: response.error || "Verification failed",
          isLoading: false,
        })
      }
    } catch (error) {
      set({
        error: "Network error occurred",
        isLoading: false,
      })
    }
  },

  logout: () => {
    apiClient.clearToken()
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    })
  },

  clearError: () => {
    set({ error: null })
  },
})
