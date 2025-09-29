// API Configuration for MOOOVES Backend
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://mooves.onrender.com",
  VERSION: "/api/v1",
  ENDPOINTS: {
    // Auth endpoints from Swagger (email/password + Google)
    AUTH: {
      LOGIN: "/login", // POST /api/v1/login
      REGISTER: "/users", // POST /api/v1/users

      // 🔥 Fixed according to Swagger
      GOOGLE_AUTHENTICATE: "/google-autheticate", // GET /api/v1/google-autheticate (typo is in Swagger)
      GOOGLE_LOGIN: "/auth/google/login", // GET /api/v1/auth/google/login
    },

    // Users
    USERS: {
      LIST: "/users", // GET
      GET_BY_ID: "/users/:id", // GET
      UPDATE: "/users/:id", // PUT
      DELETE: "/users/:id", // DELETE
    },

    // Hosts (from Swagger)
    HOSTS: {
      CREATE: "/host", // POST /api/v1/host
      LIST: "/hosts", // GET /api/v1/hosts
      GET_BY_ID: "/hosts/:id", // GET /api/v1/hosts/:id
      UPDATE: "/hosts/:id", // PUT /api/v1/hosts/:id
      DELETE: "/hosts/:id", // DELETE /api/v1/hosts/:id
      LOGIN: "/hostlogin", // POST /api/v1/hostlogin

      // According to Swagger
      GOOGLE_AUTHENTICATE: "/host-google-autheticate", // GET /api/v1/host-google-autheticate
      GOOGLE_LOGIN: "/host/auth/google/login", // GET /api/v1/host/auth/google/login
    },

    // Tournaments
    TOURNAMENTS: {
      LIST: "/tournaments", // GET /api/v1/tournaments
      GET_BY_ID: "/tournaments/:id", // GET /api/v1/tournaments/:id
      CREATE: "/tournaments", // POST /api/v1/tournaments
      JOIN: "/tournaments/:id/join", // POST /api/v1/tournaments/:id/join
      USER_TOURNAMENTS: "/users/:id/tournaments", // GET /api/v1/users/:id/tournaments
    },

    // Games endpoints (from Swagger)
    GAMES: {
      LIST: "/games", // GET /api/v1/games
      GET_BY_ID: "/games/:id", // GET /api/v1/games/:id
      CREATE: "/games", // POST /api/v1/games
      UPDATE: "/games/:id", // PUT /api/v1/games/:id
      DELETE: "/games/:id", // DELETE /api/v1/games/:id
    },

    // MatchRoom endpoints (from Swagger)
    MATCHROOM: {
      LIST: "/matchroom", // GET /api/v1/matchroom
      GET_BY_ID: "/matchroom/:id", // GET /api/v1/matchroom/:id
      CREATE: "/matchroom", // POST /api/v1/matchroom
      UPDATE: "/matchroom/:id", // PUT /api/v1/matchroom/:id
      DELETE: "/matchroom/:id", // DELETE /api/v1/matchroom/:id
    },

    // Payments endpoints (if used)
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