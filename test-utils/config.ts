export const TEST_MODE = (process.env.TEST_MODE || process.env.NODE_ENV === 'test' && process.env.TEST_MODE) || 'mock'

export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:1777'

export const DEFAULT_ROLE = 'player'
