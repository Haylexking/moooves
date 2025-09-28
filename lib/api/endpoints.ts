import { API_CONFIG } from "@/lib/config/api-config"

// Helper function to build endpoint URLs
export function buildEndpoint(endpoint: string, params?: Record<string, string>): string {
  let url = endpoint

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value)
    })
  }

  return url
}

// Auth API endpoints (Users)
export const authEndpoints = {
  login: () => "/login",
  register: () => "/users",
  googleAuthenticate: () => "/google-authenticate", // redirect to Google
  googleLogin: () => "/auth/google/login", // callback returns token + user
}

// Host API endpoints
export const hostEndpoints = {
  googleAuthenticate: () => "/host-google-authenticate", // redirect to Google
  googleLogin: () => "/host/auth/google/login", // callback returns token + user
  create: () => "/api/v1/host",
  list: () => "/api/v1/hosts",
  login: () => "/hostlogin",
  getById: (id: string) => buildEndpoint("/api/v1/hosts/{id}", { id }),
  update: (id: string) => buildEndpoint("/api/v1/hosts/{id}", { id }),
  delete: (id: string) => buildEndpoint("/api/v1/hosts/{id}", { id }),
}

// Tournament endpoints
export const tournamentEndpoints = {
  list: () => API_CONFIG.ENDPOINTS.TOURNAMENTS.LIST,
  getById: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.TOURNAMENTS.GET_BY_ID, { id }),
  create: () => API_CONFIG.ENDPOINTS.TOURNAMENTS.CREATE,
  join: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.TOURNAMENTS.JOIN, { id }),
  userTournaments: (userId: string) => buildEndpoint(API_CONFIG.ENDPOINTS.TOURNAMENTS.USER_TOURNAMENTS, { id: userId }),
}

// Game endpoints (from API_CONFIG)
export const gameEndpoints = {
  list: () => API_CONFIG.ENDPOINTS.GAMES.LIST,
  create: () => API_CONFIG.ENDPOINTS.GAMES.CREATE,
  getById: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.GAMES.GET_BY_ID, { id }),
  update: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.GAMES.UPDATE, { id }),
  delete: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.GAMES.DELETE, { id }),
}

// MatchRoom endpoints (from API_CONFIG)
export const matchRoomEndpoints = {
  list: () => API_CONFIG.ENDPOINTS.MATCHROOM.LIST,
  create: () => API_CONFIG.ENDPOINTS.MATCHROOM.CREATE,
  getById: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.MATCHROOM.GET_BY_ID, { id }),
  update: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.MATCHROOM.UPDATE, { id }),
  delete: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.MATCHROOM.DELETE, { id }),
}

// Payment endpoints (placeholder for future)
export const paymentEndpoints = {
  initiate: () => "/payments/initiate",
  verify: (reference: string) => buildEndpoint("/payments/verify/:reference", { reference }),
  webhooks: () => "/payments/webhooks",
  getHistory: () => "/payments/history",
}
