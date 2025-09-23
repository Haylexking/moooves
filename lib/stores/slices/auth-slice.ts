
import type { StateCreator } from "zustand"
import type { User, UserRole } from "@/lib/types"
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
  setToken: (token: string) => void
  setUser: (user: User) => void
  setIsAuthenticated: (isAuthenticated: boolean) => void
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
        const { token, user: userData } = response.data
        apiClient.setToken(token)
        set({
          user: {
            ...userData,
            id: userData.id,
            email: userData.email,
            fullName: userData.fullName,
            phone: userData.phone,
            emailVerified: userData.emailVerified || false,
            role: ((userData as any).role as UserRole) || "user",
            gamesPlayed: typeof (userData as any).gamesPlayed === "number" ? (userData as any).gamesPlayed : 0,
            canHost: typeof (userData as any).canHost === "boolean" ? (userData as any).canHost : false,
            createdAt: (userData as any).createdAt || new Date().toISOString(),
            lastActive: (userData as any).lastActive || new Date().toISOString(),
          },
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
        const userData = response.data.user
        set({
          user: {
            ...userData,
            id: userData.id,
            email: userData.email,
            fullName: userData.fullName,
            phone: userData.phone,
            emailVerified: false,
            role: ((userData as any).role as UserRole) || "user",
            gamesPlayed: typeof (userData as any).gamesPlayed === "number" ? (userData as any).gamesPlayed : 0,
            canHost: typeof (userData as any).canHost === "boolean" ? (userData as any).canHost : false,
            createdAt: (userData as any).createdAt || new Date().toISOString(),
            lastActive: (userData as any).lastActive || new Date().toISOString(),
          },
          isAuthenticated: false,
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

  setToken: (token: string) => {
    apiClient.setToken(token)
  },


  setUser(user) {
    set({ user })
  },

  setIsAuthenticated: (isAuthenticated: boolean) => {
    set({ isAuthenticated })
  },
})
