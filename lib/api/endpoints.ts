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

// 🔹 Auth API endpoints (Users)
export const authEndpoints = {
  login: () => API_CONFIG.ENDPOINTS.AUTH.LOGIN,
  register: () => API_CONFIG.ENDPOINTS.AUTH.REGISTER,
  googleAuthenticate: () => API_CONFIG.ENDPOINTS.AUTH.GOOGLE_AUTHENTICATE, // /google-autheticate (typo in Swagger)
  googleLogin: () => API_CONFIG.ENDPOINTS.AUTH.GOOGLE_LOGIN, // /auth/google/login
}

// 🔹 Host API endpoints
export const hostEndpoints = {
  googleAuthenticate: () => API_CONFIG.ENDPOINTS.HOSTS.GOOGLE_AUTHENTICATE, // /host-google-autheticate (typo in Swagger)
  googleLogin: () => API_CONFIG.ENDPOINTS.HOSTS.GOOGLE_LOGIN, // /host/auth/google/login
  create: () => API_CONFIG.ENDPOINTS.HOSTS.CREATE,
  list: () => API_CONFIG.ENDPOINTS.HOSTS.LIST,
  login: () => API_CONFIG.ENDPOINTS.HOSTS.LOGIN,
  getById: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.HOSTS.GET_BY_ID, { id }),
  update: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.HOSTS.UPDATE, { id }),
  delete: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.HOSTS.DELETE, { id }),
}

// 🔹 Tournament endpoints
export const tournamentEndpoints = {
  list: () => API_CONFIG.ENDPOINTS.TOURNAMENTS.LIST,
  getById: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.TOURNAMENTS.GET_BY_ID, { id }),
  create: () => API_CONFIG.ENDPOINTS.TOURNAMENTS.CREATE,
  join: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.TOURNAMENTS.JOIN, { id }),
  userTournaments: (userId: string) =>
    buildEndpoint(API_CONFIG.ENDPOINTS.TOURNAMENTS.USER_TOURNAMENTS, { id: userId }),
}

// 🔹 Game endpoints
export const gameEndpoints = {
  list: () => API_CONFIG.ENDPOINTS.GAMES.LIST,
  create: () => API_CONFIG.ENDPOINTS.GAMES.CREATE,
  getById: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.GAMES.GET_BY_ID, { id }),
  update: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.GAMES.UPDATE, { id }),
  delete: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.GAMES.DELETE, { id }),
}

// 🔹 MatchRoom endpoints
export const matchRoomEndpoints = {
  list: () => API_CONFIG.ENDPOINTS.MATCHROOM.LIST,
  create: () => API_CONFIG.ENDPOINTS.MATCHROOM.CREATE,
  getById: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.MATCHROOM.GET_BY_ID, { id }),
  update: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.MATCHROOM.UPDATE, { id }),
  delete: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.MATCHROOM.DELETE, { id }),
}

// 🔹 Payment endpoints (placeholder for future)
export const paymentEndpoints = {
  initiate: () => "/payments/initiate",
  verify: (reference: string) => buildEndpoint("/payments/verify/:reference", { reference }),
  webhooks: () => "/payments/webhooks",
  getHistory: () => "/payments/history",
}