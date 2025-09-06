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

// Auth API endpoints
export const authEndpoints = {
  login: () => API_CONFIG.ENDPOINTS.AUTH.LOGIN,
  register: () => API_CONFIG.ENDPOINTS.AUTH.REGISTER,
  googleAuthenticate: () => API_CONFIG.ENDPOINTS.AUTH.GOOGLE_AUTHENTICATE,
  googleLogin: () => API_CONFIG.ENDPOINTS.AUTH.GOOGLE_LOGIN,
}

// Host API endpoints
export const hostEndpoints = {
  googleAuthenticate: () => API_CONFIG.ENDPOINTS.HOSTS.GOOGLE_AUTHENTICATE,
  googleLogin: () => API_CONFIG.ENDPOINTS.HOSTS.GOOGLE_LOGIN,
  create: () => API_CONFIG.ENDPOINTS.HOSTS.CREATE,
  list: () => API_CONFIG.ENDPOINTS.HOSTS.LIST,
  login: () => API_CONFIG.ENDPOINTS.HOSTS.LOGIN,
  getById: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.HOSTS.GET_BY_ID, { id }),
  update: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.HOSTS.UPDATE, { id }),
  delete: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.HOSTS.DELETE, { id }),
}

// Tournament endpoints (placeholder for future)
export const tournamentEndpoints = {
  create: () => "/tournaments",
  list: () => "/tournaments",
  getById: (id: string) => buildEndpoint("/tournaments/:id", { id }),
  join: (id: string) => buildEndpoint("/tournaments/:id/join", { id }),
  start: (id: string) => buildEndpoint("/tournaments/:id/start", { id }),
  getByInvite: (code: string) => buildEndpoint("/tournaments/invite/:code", { code }),
  leave: (id: string) => buildEndpoint("/tournaments/:id/leave", { id }),
}

// Game endpoints (placeholder for future)
export const gameEndpoints = {
  create: () => "/games",
  getById: (id: string) => buildEndpoint("/games/:id", { id }),
  makeMove: (id: string) => buildEndpoint("/games/:id/moves", { id }),
  getMoves: (id: string) => buildEndpoint("/games/:id/moves", { id }),
  endGame: (id: string) => buildEndpoint("/games/:id/end", { id }),
}

// Payment endpoints (placeholder for future)
export const paymentEndpoints = {
  initiate: () => "/payments/initiate",
  verify: (reference: string) => buildEndpoint("/payments/verify/:reference", { reference }),
  webhooks: () => "/payments/webhooks",
  getHistory: () => "/payments/history",
}
