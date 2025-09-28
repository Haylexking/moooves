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
  register: (fullName: string, email: string, password: string) => Promise<void>
  hostLogin: (email: string, password: string) => Promise<void>
  hostRegister: (fullName: string, email: string, password: string) => Promise<void>
  verifyEmail: (code: string) => Promise<void>
  logout: () => void
  clearError: () => void
  setToken: (token: string) => void
  setUser: (user: User) => void
  setIsAuthenticated: (isAuthenticated: boolean) => void
}

const parseApiError = (error: string): string => {
  if (error.includes("Email:") && error.includes("already in use")) {
    const emailMatch = error.match(/Email: ([^\s]+) already in use/)
    return emailMatch ? `Email ${emailMatch[1]} is already registered` : "Email is already in use"
  }
  if (error.includes("Name:") && error.includes("already in use")) {
    const nameMatch = error.match(/Name: ([^]+) already in use/)
    return nameMatch ? `Username "${nameMatch[1]}" is already taken` : "Username is already taken"
  }
  if (error.includes("Passwords do not match")) {
    return "Passwords do not match"
  }
  if (error.includes("Invalid email or password")) {
    return "Invalid email or password"
  }
  return error
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
        const token = response.data.token
        const userData = response.data.data
        if (token) apiClient.setToken(token)
        set({
          user: {
            id: userData._id,
            email: userData.email,
            fullName: (userData as any)?.fullName ?? (userData as any)?.name ?? "",
            emailVerified: (userData as any)?.emailVerified ?? false,
            role: (userData as any)?.role ?? "player",
            gamesPlayed: typeof (userData as any)?.gamesPlayed === "number" ? (userData as any).gamesPlayed : 0,
            canHost: typeof (userData as any)?.canHost === "boolean" ? (userData as any).canHost : false,
            createdAt: new Date(userData.createdAt || new Date()).getTime(),
            lastActive: new Date(userData.updatedAt || new Date()).getTime(),
          },
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        set({
          error: parseApiError(response.error || "Login failed"),
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

  hostLogin: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.hostLogin(email, password)
      if (response.success && response.data) {
        const token = response.data.token
        const userData = response.data.data
        if (token) apiClient.setToken(token)
        set({
          user: {
            id: userData._id,
            email: userData.email,
            fullName: (userData as any)?.name ?? (userData as any)?.fullName ?? "",
            emailVerified: (userData as any)?.emailVerified ?? false,
            role: "host" as UserRole,
            gamesPlayed: typeof (userData as any)?.gamesPlayed === "number" ? (userData as any).gamesPlayed : 0,
            canHost: true,
            createdAt: new Date(userData.createdAt || new Date()).getTime(),
            lastActive: new Date(userData.updatedAt || new Date()).getTime(),
          },
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        set({
          error: parseApiError(response.error || "Host login failed"),
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

  register: async (fullName: string, email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.register(fullName, email, password)
      if (response.success && response.data) {
        const token = response.data.token
        const userData = response.data.data
        if (token) apiClient.setToken(token)
        set({
          user: {
            id: userData._id,
            email: userData.email,
            fullName: (userData as any)?.fullName ?? (userData as any)?.name ?? "",
            emailVerified: (userData as any)?.emailVerified ?? false,
            role: "player" as UserRole,
            gamesPlayed: 0,
            canHost: false,
            createdAt: new Date(userData.createdAt || new Date()).getTime(),
            lastActive: new Date(userData.updatedAt || new Date()).getTime(),
          },
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        set({
          error: parseApiError(response.error || "Registration failed"),
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

  hostRegister: async (fullName: string, email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.createHost(fullName, email, password)
      if (response.success && response.data) {
        const token = (response.data as any)?.token
        // Host registration returns host object, not data
        const hostData = (response.data as any)?.host ?? (response.data as any)?.data
        if (token) apiClient.setToken(token)
        set({
          user: {
            id: hostData._id,
            email: hostData.email,
            fullName: (hostData as any)?.fullName ?? (hostData as any)?.name ?? "",
            emailVerified: false,
            role: "host" as UserRole,
            gamesPlayed: 0,
            canHost: true,
            createdAt: new Date(hostData.createdAt || new Date()).getTime(),
            lastActive: new Date(hostData.updatedAt || new Date()).getTime(),
          },
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        set({
          error: parseApiError(response.error || "Host registration failed"),
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
