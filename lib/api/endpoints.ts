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

// Game/Payment endpoints omitted; not in current Swagger

// Payment API endpoints
export const paymentEndpoints = {
  initiate: () => API_CONFIG.ENDPOINTS.PAYMENTS.INITIATE,
  verify: (reference: string) => buildEndpoint(API_CONFIG.ENDPOINTS.PAYMENTS.VERIFY, { reference }),
  webhooks: () => API_CONFIG.ENDPOINTS.PAYMENTS.WEBHOOKS,
  getHistory: () => API_CONFIG.ENDPOINTS.PAYMENTS.GET_HISTORY,
}
