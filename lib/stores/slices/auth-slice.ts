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
  // Clear any previously stored auth token and user state before attempting a new login.
  // This prevents accidental reuse of stale tokens and avoids the persisted
  // Zustand state from rehydrating an old user while a new login is in progress.
  apiClient.clearToken()
  set({ user: null, isAuthenticated: false })
      const response = await apiClient.login(email, password)
      if (response.success && response.data) {
        const token = response.data.token
        const payloadUser = response.data.data as any

        if (!token) {
          // If login didn't return a token, surface an error and set partial user from payload
          set({
            user: {
              id: payloadUser?._id ?? payloadUser?.id ?? null,
              email: payloadUser?.email ?? "",
              fullName: payloadUser?.fullName ?? payloadUser?.name ?? "",
              emailVerified: payloadUser?.emailVerified ?? false,
              role: 'player' as UserRole,
              gamesPlayed: typeof payloadUser?.gamesPlayed === "number" ? payloadUser.gamesPlayed : 0,
              canHost: Boolean(payloadUser?.canHost),
              createdAt: new Date(payloadUser?.createdAt || new Date()).getTime(),
              lastActive: new Date(payloadUser?.updatedAt || new Date()).getTime(),
            },
            isAuthenticated: false,
            isLoading: false,
            error: 'Login did not return an auth token. Please try logging in again.',
          })
          return
        }

        // Set token and try to fetch authoritative user via token-decoded GET /users/{id}
        apiClient.setToken(token)
        try {
          const me = await apiClient.getCurrentUser()
          if (me.success && me.data) {
            const serverUser = me.data
            set({
              user: {
                id: serverUser?._id ?? serverUser?.id ?? payloadUser?._id ?? payloadUser?.id ?? null,
                email: serverUser?.email ?? payloadUser?.email ?? "",
                fullName: serverUser?.fullName ?? serverUser?.name ?? payloadUser?.fullName ?? payloadUser?.name ?? "",
                emailVerified: serverUser?.emailVerified ?? false,
                role: 'player' as UserRole,
                gamesPlayed: typeof serverUser?.gamesPlayed === "number" ? serverUser.gamesPlayed : 0,
                canHost: Boolean(serverUser?.canHost || payloadUser?.canHost),
                createdAt: new Date(serverUser?.createdAt || payloadUser?.createdAt || new Date()).getTime(),
                lastActive: new Date(serverUser?.updatedAt || payloadUser?.updatedAt || new Date()).getTime(),
              },
              isAuthenticated: true,
              isLoading: false,
            })
            return
          }

          // If we couldn't fetch authoritative user, fallback to payload but clear token
          apiClient.clearToken()
          set({
            user: {
              id: payloadUser?._id ?? payloadUser?.id ?? null,
              email: payloadUser?.email ?? "",
              fullName: payloadUser?.fullName ?? payloadUser?.name ?? "",
              emailVerified: payloadUser?.emailVerified ?? false,
              role: 'player' as UserRole,
              gamesPlayed: typeof payloadUser?.gamesPlayed === "number" ? payloadUser.gamesPlayed : 0,
              canHost: Boolean(payloadUser?.canHost),
              createdAt: new Date(payloadUser?.createdAt || new Date()).getTime(),
              lastActive: new Date(payloadUser?.updatedAt || new Date()).getTime(),
            },
            isAuthenticated: false,
            isLoading: false,
            error: `Failed to resolve user identity: ${me.error || 'unknown'}`,
          })
          return
        } catch (e) {
          apiClient.clearToken()
          set({ user: null, isAuthenticated: false, error: 'Network error occurred', isLoading: false })
          return
        }
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
  // Ensure no stale token is sent and clear current user while host login occurs.
  apiClient.clearToken()
  set({ user: null, isAuthenticated: false })
      const response = await apiClient.hostLogin(email, password)
      if (response.success) {
        // Support multiple backend shapes: { data: { token, data|host } } or { token, data }
        const token = (response.data && ((response.data as any).token || (response as any).token)) || (response as any).token || null
        const payload = response.data || (response as any) || {}
        let userData = (payload.host || payload.data || payload.user || payload) as any

        if (token) {
          apiClient.setToken(token)
          try {
            const me = await apiClient.getCurrentHost()
            if (me.success && me.data) {
              userData = me.data
            } else if (!me.success && me.error && String(me.error).toLowerCase().includes('invalid user id')) {
              apiClient.clearToken()
              set({ user: null, isAuthenticated: false, isLoading: false, error: 'Host account verified differently — please login as host.' })
              return
            }
          } catch (e) {
            // ignore
          }
        }

        const resolvedRole: UserRole = 'host'

        set({
          user: {
            id: userData?._id ?? userData?.id ?? null,
            email: userData?.email ?? "",
            fullName: userData?.fullName ?? userData?.name ?? "",
            emailVerified: userData?.emailVerified ?? false,
            role: resolvedRole,
            gamesPlayed: typeof userData?.gamesPlayed === "number" ? userData.gamesPlayed : 0,
            canHost: Boolean(userData?.canHost),
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
  // Clear any existing token and user state before registering a new user
  apiClient.clearToken()
  set({ user: null, isAuthenticated: false })
      const response = await apiClient.register(fullName, email, password)
      if (response.success && response.data) {
        const created = response.data.data as any

        // After successful registration, attempt automatic login (POST /api/v1/login) to obtain a token.
        try {
          const loginResp = await apiClient.login(email, password)
          if (!loginResp || !loginResp.success) {
            // Registration succeeded but automatic login failed: set user but mark unauthenticated
            set({
              user: {
                id: created?._id ?? created?.id ?? null,
                email: created?.email ?? "",
                fullName: created?.fullName ?? created?.name ?? "",
                emailVerified: created?.emailVerified ?? false,
                role: 'player' as UserRole,
                gamesPlayed: 0,
                canHost: false,
                createdAt: new Date(created?.createdAt || new Date()).getTime(),
                lastActive: new Date(created?.updatedAt || new Date()).getTime(),
              },
              isAuthenticated: false,
              isLoading: false,
              error: 'Registered successfully but automatic login failed. Please log in manually.',
            })
            return
          }

          const token = (loginResp.data && ((loginResp.data as any).token || (loginResp as any).token)) || (loginResp as any).token || null
          if (!token) {
            set({
              user: {
                id: created?._id ?? created?.id ?? null,
                email: created?.email ?? "",
                fullName: created?.fullName ?? created?.name ?? "",
                emailVerified: created?.emailVerified ?? false,
                role: 'player' as UserRole,
                gamesPlayed: 0,
                canHost: false,
                createdAt: new Date(created?.createdAt || new Date()).getTime(),
                lastActive: new Date(created?.updatedAt || new Date()).getTime(),
              },
              isAuthenticated: false,
              isLoading: false,
              error: 'Automatic login did not return a token. Please log in manually.',
            })
            return
          }

          apiClient.setToken(token)
          // Fetch authoritative user via token
          const me = await apiClient.getCurrentUser()
          if (me.success && me.data) {
            const serverUser = me.data
            set({
              user: {
                id: serverUser?._id ?? serverUser?.id ?? created?._id ?? created?.id ?? null,
                email: serverUser?.email ?? created?.email ?? "",
                fullName: serverUser?.fullName ?? serverUser?.name ?? created?.fullName ?? created?.name ?? "",
                emailVerified: serverUser?.emailVerified ?? false,
                role: 'player' as UserRole,
                gamesPlayed: typeof serverUser?.gamesPlayed === "number" ? serverUser.gamesPlayed : 0,
                canHost: false,
                createdAt: new Date(serverUser?.createdAt || created?.createdAt || new Date()).getTime(),
                lastActive: new Date(serverUser?.updatedAt || created?.updatedAt || new Date()).getTime(),
              },
              isAuthenticated: true,
              isLoading: false,
            })
            return
          }

          // If identity resolution failed, clear token and set unauthenticated created user
          apiClient.clearToken()
          set({
            user: {
              id: created?._id ?? created?.id ?? null,
              email: created?.email ?? "",
              fullName: created?.fullName ?? created?.name ?? "",
              emailVerified: created?.emailVerified ?? false,
              role: 'player' as UserRole,
              gamesPlayed: 0,
              canHost: false,
              createdAt: new Date(created?.createdAt || new Date()).getTime(),
              lastActive: new Date(created?.updatedAt || new Date()).getTime(),
            },
            isAuthenticated: false,
            isLoading: false,
            error: `Registered but failed to resolve user identity: ${me.error || 'unknown'}`,
          })
          return
        } catch (e) {
          set({ error: 'Network error occurred during automatic login', isLoading: false })
          return
        }
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
  // Clear token and any current user state to avoid interference with host registration
  apiClient.clearToken()
  set({ user: null, isAuthenticated: false })
      // Try createHost with a single retry if the server reports a connection timeout
      let response = await apiClient.createHost(fullName, email, password)
      if (!response.success && response.error && String(response.error).toLowerCase().includes('timeout')) {
        // wait 1s and retry once
        await new Promise((res) => setTimeout(res, 1000))
        try {
          response = await apiClient.createHost(fullName, email, password)
        } catch (e) {
          // ignore - response will be handled below
        }
      }

    if (response.success) {
  // Capture the created host payload so we can use it as a fallback for canHost if
  // the authoritative profile fetched after login doesn't include the flag.
  const hostData = (response.data && ((response.data as any).data || response.data)) as any

  // After createHost succeeds, explicitly call hostLogin to obtain a token (createHost does not return a token per API contract).
  try {
    const loginResp = await apiClient.hostLogin(email, password)
    if (!loginResp || !loginResp.success) {
      set({ error: 'Host created but automatic login failed. Please login manually.', isLoading: false })
      return
    }

    const token = (loginResp.data && ((loginResp.data as any).token || (loginResp as any).token)) || (loginResp as any).token || null
    if (!token) {
      set({ error: 'Host created but login did not return a token. Please login manually.', isLoading: false })
      return
    }

    apiClient.setToken(token)

    // Use token decoding + GET /host/{id} (implemented in apiClient.getCurrentHost)
    const me = await apiClient.getCurrentHost()
    if (!me.success) {
      apiClient.clearToken()
      set({ error: `Failed to resolve host identity after login: ${me.error || 'unknown'}`, isLoading: false })
      return
    }

    const serverUser = me.data
    set({
      user: {
        id: serverUser?._id ?? serverUser?.id ?? null,
        email: serverUser?.email ?? "",
        fullName: serverUser?.fullName ?? serverUser?.name ?? "",
        emailVerified: serverUser?.emailVerified ?? false,
        role: 'host' as UserRole,
        gamesPlayed: 0,
        // Prefer the authoritative serverUser.canHost, but fall back to the
        // created host payload when available.
        canHost: Boolean(serverUser?.canHost || hostData?.canHost),
        createdAt: new Date(serverUser?.createdAt || new Date()).getTime(),
        lastActive: new Date(serverUser?.updatedAt || new Date()).getTime(),
      },
      isAuthenticated: true,
      isLoading: false,
    })
    return
  } catch (e) {
    set({ error: 'Network error occurred during host post-registration login', isLoading: false })
    return
  }
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

  setRehydrated(v: boolean) {
    set({ rehydrated: v })
  },

  setIsAuthenticated: (isAuthenticated: boolean) => {
    set({ isAuthenticated })
  },
})
