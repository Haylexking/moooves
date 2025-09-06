// API Configuration for MOOOVES Backend
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://mooves.onrender.com",
  VERSION: "/api/v1",
  ENDPOINTS: {
    // Auth endpoints from Swagger (email/password + Google)
    AUTH: {
      LOGIN: "/login", // POST /api/v1/login
      GOOGLE_AUTHENTICATE: "/google-authenticate", // GET /api/v1/google-authenticate
      GOOGLE_LOGIN: "/auth/google/login", // GET /api/v1/auth/google/login
      REGISTER: "/users", // POST /api/v1/users
    },

    // Users
    USERS: {
      LIST: "/users", // GET
      GET_BY_ID: "/users/:id", // GET
      UPDATE: "/users/:id", // PUT
      DELETE: "/users/:id", // DELETE
    },

    // Hosts
    HOSTS: {
      GOOGLE_AUTHENTICATE: "/google-authenticate", // GET
      GOOGLE_LOGIN: "/auth/google/login", // GET
      CREATE: "/host", // POST
      LIST: "/host", // GET
      LOGIN: "/hostlogin", // POST
      GET_BY_ID: "/host/:id", // GET
      UPDATE: "/host/:id", // PUT
      DELETE: "/host/:id", // DELETE
    },

    // Optional: games/payments kept for future; remove if not used
    GAMES: {},
    PAYMENTS: {},

    ADMIN: {},
  },

  // Request timeout
  TIMEOUT: 30000, // 30 seconds

  // Retry configuration
  RETRY: {
    ATTEMPTS: 3,
    DELAY: 1000, // 1 second
  },
} as const
