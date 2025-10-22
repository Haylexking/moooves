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
      LIST: "/host", // GET /api/v1/host (Swagger exposes singular /host for creating and listing)
      GET_BY_ID: "/host/:id", // GET /api/v1/host/:id
      UPDATE: "/host/:id", // PUT /api/v1/host/:id
      DELETE: "/host/:id", // DELETE /api/v1/host/:id
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
      LIST: "/matchroom", // GET /api/v1/matchroom (swagger canonical)
      GET_BY_ID: "/matchroom/:id", // GET /api/v1/matchroom/:id
      CREATE: "/matchroom", // POST /api/v1/matchroom
      UPDATE: "/matchroom/:id", // PUT /api/v1/matchroom/:id
      DELETE: "/matchroom/:id", // DELETE /api/v1/matchroom/:id
    },

    // Payments endpoints (if used)
    PAYMENTS: {
      DISTRIBUTE: "/distribute/:tournamentId", // POST /api/v1/distribute/{tournamentId}
      SEND: "/send", // POST /api/v1/send
    },

    ADMIN: {},
  },

  // Request timeout
  TIMEOUT: 60000, // 60 seconds

  // Retry configuration
  RETRY: {
    ATTEMPTS: 3,
    DELAY: 1000, // 1 second
  },
} as const

// For backwards-compatibility with the running backend (older server paths), provide
// a small helper that maps the client to the actual endpoints the ApiClient uses
// (these are the routes observed in the wild: /match and /matchs). Use this in
// places where the client needs the concrete runtime path.
export const MATCHROOM_ENDPOINTS = {
  CREATE: "/match",
  JOIN: "/match/:id",
  LIST: "/matchs",
  GET_BY_ID: "/matchs/:id",
  DELETE: "/matchs/:id",
} as const