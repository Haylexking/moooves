import type { StateCreator } from "zustand"
import type { User, UserRole } from "@/lib/types"
import { apiClient } from "@/lib/api/client"

export interface AuthSlice {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  rehydrated?: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (fullName: string, email: string, password: string) => Promise<void>
  hostLogin: (email: string, password: string) => Promise<void>
  hostRegister: (fullName: string, email: string, password: string) => Promise<void>
  verifyEmail: (code: string) => Promise<void>
  verifyAccountOtp: (email: string, otp: string) => Promise<void>
  logout: () => void
  clearError: () => void
  setToken: (token: string) => void
  setUser: (user: User) => void
  setIsAuthenticated: (isAuthenticated: boolean) => void
  setRehydrated?: (v: boolean) => void
}

const parseApiError = (error: string): string => {
  if (error.includes("Email:") && error.includes("already in use")) {
    const emailMatch = error.match(/Email: ([^\s]+) already in use/)
    return emailMatch ? `Email ${emailMatch[1]} is already registered` : "Email is already in use"
  }
  if (error.includes("Name:") && error.includes("already in use")) {
    const nameMatch = error.match(/Name: ([^]+) already in use/)
    return nameMatch ? `Username \"${nameMatch[1]}\" is already taken` : "Username is already taken"
  }
  if (error.includes("Passwords do not match")) {
    return "Passwords do not match"
  }
  if (
    error.toLowerCase().includes("invalid email or password") ||
    error.toLowerCase().includes("incorrect password") ||
    error.toLowerCase().includes("wrong password")
  ) {
    return "Your password is incorrect. Please try again."
  }
  return error
}

export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  user: null,
  isAuthenticated: false,
  rehydrated: false,
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
            role: "player" as UserRole,
            gamesPlayed: typeof (userData as any)?.gamesPlayed === "number" ? (userData as any).gamesPlayed : 0,
            canHost: typeof (userData as any)?.canHost === "boolean" ? (userData as any).canHost : false,
            createdAt: new Date(userData.createdAt || new Date()).getTime(),
            lastActive: new Date(userData.updatedAt || new Date()).getTime(),
          },
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        // Ensure any previous token is cleared when login fails to avoid accidental
        // re-authentication from stale tokens persisted in localStorage.
        apiClient.clearToken()
        set({
          user: null,
          isAuthenticated: false,
          error: parseApiError(response.error || "Login failed"),
          isLoading: false,
        })
      }
    } catch (error) {
      // On network exceptions also clear any possibly stale token
      apiClient.clearToken()
      set({
        user: null,
        isAuthenticated: false,
        error: "Network error occurred",
        isLoading: false,
      })
    }
  },

  hostLogin: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.hostLogin(email, password)
      if (response.success) {
        // Support multiple backend shapes: { data: { token, data|host } } or { token, data }
        const token = (response.data && ((response.data as any).token || (response as any).token)) || (response as any).token || null
        const payload = response.data || (response as any) || {}
        const userData = (payload.host || payload.data || payload.user || payload) as any

        if (token) apiClient.setToken(token)
        set({
          user: {
            id: userData?._id ?? userData?.id ?? null,
            email: userData?.email ?? "",
            fullName: userData?.fullName ?? userData?.name ?? "",
            emailVerified: userData?.emailVerified ?? false,
            role: "host" as UserRole,
            gamesPlayed: typeof userData?.gamesPlayed === "number" ? userData.gamesPlayed : 0,
            canHost: true,
            createdAt: new Date(userData?.createdAt || new Date()).getTime(),
            lastActive: new Date(userData?.updatedAt || new Date()).getTime(),
          },
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        // Clear token on failure
        apiClient.clearToken()
        set({ error: parseApiError(response.error || "Host login failed"), isLoading: false })
      }
    } catch (error) {
        apiClient.clearToken()
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
      if (response.success) {
        // Similar tolerant parsing as hostLogin: token may be nested
        const token = (response.data && ((response.data as any).token || (response as any).token)) || (response as any).token || null
        const payload = response.data || (response as any) || {}
        const hostData = (payload.host || payload.data || payload.user || payload) as any

        if (token) apiClient.setToken(token)
        set({
          user: {
            id: hostData?._id ?? hostData?.id ?? null,
            email: hostData?.email ?? "",
            fullName: hostData?.fullName ?? hostData?.name ?? "",
            emailVerified: hostData?.emailVerified ?? false,
            role: "host" as UserRole,
            gamesPlayed: 0,
            canHost: true,
            createdAt: new Date(hostData?.createdAt || new Date()).getTime(),
            lastActive: new Date(hostData?.updatedAt || new Date()).getTime(),
          },
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        set({ error: parseApiError(response.error || "Host registration failed"), isLoading: false })
      }
    } catch (error) {
      set({
        error: "Network error occurred",
        isLoading: false,
      })
    }
  },

  verifyEmail: async (code: string) => {
    // Deprecated in favor of verifyAccountOtp with email+otp, but kept for compatibility.
    const currentUser = get().user
    if (!currentUser?.email) {
      set({ error: "Email unavailable for verification", isLoading: false })
      return
    }
    await get().verifyAccountOtp(currentUser.email, code)
  },

  verifyAccountOtp: async (email: string, otp: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.verifyAccountOtp(email, otp)
      if (response.success) {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, emailVerified: true }, isLoading: false })
        } else {
          set({ isLoading: false })
        }
        // Redirect similar to post-login: honor return_to if present
        if (typeof window !== 'undefined') {
          try {
            const ret = localStorage.getItem('return_to')
            if (ret) {
              localStorage.removeItem('return_to')
              window.location.href = ret
              return
            }
          } catch {}
          try { window.location.href = '/dashboard' } catch {}
        }
      } else {
        set({ error: response.error || response.message || 'OTP verification failed', isLoading: false })
      }
    } catch (error) {
      set({ error: 'Network error occurred', isLoading: false })
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

  setRehydrated(v: boolean) {
    set({ rehydrated: v })
  },

  setIsAuthenticated: (isAuthenticated: boolean) => {
    set({ isAuthenticated })
  },
})
