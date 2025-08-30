// API Configuration for MOOOVES Backend
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://mooves.onrender.com",
  VERSION: "/api/v1", // Backend uses /api/v1 prefix
  ENDPOINTS: {
    // Auth endpoints - based on your actual backend
    AUTH: {
      LOGIN: "/login", // /api/v1/login
      REGISTER: "/users", // /api/v1/users (POST for new users)
      VERIFY_EMAIL: "/auth/verify-email", // Placeholder
      REFRESH_TOKEN: "/auth/refresh", // Placeholder
      LOGOUT: "/auth/logout", // Placeholder
      FORGOT_PASSWORD: "/auth/forgot-password", // Placeholder
      RESET_PASSWORD: "/auth/reset-password", // Placeholder
    },

    // User endpoints - based on your actual backend
    USERS: {
      LIST: "/users", // /api/v1/users (GET for list)
      GET_BY_ID: "/users/:id", // /api/v1/users/{id}
      UPDATE: "/users/:id", // /api/v1/users/{id} (PUT/PATCH)
      DELETE: "/users/:id", // /api/v1/users/{id} (DELETE)
      PROFILE: "/users/profile", // Placeholder
      GET_STATS: "/users/stats", // Placeholder
    },

    // Tournament endpoints (placeholders - adjust based on your backend)
    TOURNAMENTS: {
      CREATE: "/tournaments",
      LIST: "/tournaments",
      GET_BY_ID: "/tournaments/:id",
      JOIN: "/tournaments/:id/join",
      START: "/tournaments/:id/start",
      GET_BY_INVITE: "/tournaments/invite/:code",
      LEAVE: "/tournaments/:id/leave",
    },

    // Game endpoints (placeholders)
    GAMES: {
      CREATE: "/games",
      GET_BY_ID: "/games/:id",
      MAKE_MOVE: "/games/:id/moves",
      GET_MOVES: "/games/:id/moves",
      END_GAME: "/games/:id/end",
    },

    // Payment endpoints (placeholders)
    PAYMENTS: {
      INITIATE: "/payments/initiate",
      VERIFY: "/payments/verify/:reference",
      WEBHOOKS: "/payments/webhooks",
      GET_HISTORY: "/payments/history",
    },

    // Admin endpoints (placeholders)
    ADMIN: {
      STATS: "/admin/stats",
      USERS: "/admin/users",
      TOURNAMENTS: "/admin/tournaments",
      PAYMENTS: "/admin/payments",
    },
  },

  // Request timeout
  TIMEOUT: 30000, // 30 seconds

  // Retry configuration
  RETRY: {
    ATTEMPTS: 3,
    DELAY: 1000, // 1 second
  },
} as const
