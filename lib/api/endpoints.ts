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
  verifyEmail: () => API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL,
  refreshToken: () => API_CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN,
  logout: () => API_CONFIG.ENDPOINTS.AUTH.LOGOUT,
  forgotPassword: () => API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD,
  resetPassword: () => API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD,
}

// Tournament API endpoints
export const tournamentEndpoints = {
  create: () => API_CONFIG.ENDPOINTS.TOURNAMENTS.CREATE,
  list: () => API_CONFIG.ENDPOINTS.TOURNAMENTS.LIST,
  getById: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.TOURNAMENTS.GET_BY_ID, { id }),
  join: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.TOURNAMENTS.JOIN, { id }),
  start: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.TOURNAMENTS.START, { id }),
  getByInvite: (code: string) => buildEndpoint(API_CONFIG.ENDPOINTS.TOURNAMENTS.GET_BY_INVITE, { code }),
  leave: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.TOURNAMENTS.LEAVE, { id }),
}

// Game API endpoints
export const gameEndpoints = {
  create: () => API_CONFIG.ENDPOINTS.GAMES.CREATE,
  getById: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.GAMES.GET_BY_ID, { id }),
  makeMove: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.GAMES.MAKE_MOVE, { id }),
  getMoves: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.GAMES.GET_MOVES, { id }),
  endGame: (id: string) => buildEndpoint(API_CONFIG.ENDPOINTS.GAMES.END_GAME, { id }),
}

// Payment API endpoints
export const paymentEndpoints = {
  initiate: () => API_CONFIG.ENDPOINTS.PAYMENTS.INITIATE,
  verify: (reference: string) => buildEndpoint(API_CONFIG.ENDPOINTS.PAYMENTS.VERIFY, { reference }),
  webhooks: () => API_CONFIG.ENDPOINTS.PAYMENTS.WEBHOOKS,
  getHistory: () => API_CONFIG.ENDPOINTS.PAYMENTS.GET_HISTORY,
}
