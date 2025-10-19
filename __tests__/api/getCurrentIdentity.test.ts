import { apiClient } from '@/lib/api/client'
import { API_CONFIG } from '@/lib/config/api-config'

// Helper to create a fake JWT with a given payload object
function makeFakeJwt(payload: Record<string, any>) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64').replace(/=/g, '')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=/g, '')
  return `${header}.${body}.signature`
}

describe('ApiClient identity helpers', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    // reset token and mocks
    apiClient.clearToken()
    // @ts-ignore
    global.fetch = jest.fn()
  })

  afterEach(() => {
    // @ts-ignore
    global.fetch = originalFetch
    jest.resetAllMocks()
  })

  test('getCurrentHost decodes token and calls /host/{id}', async () => {
    const hostId = '64b8aef5f1e3b2d5c3a12345'
    const token = makeFakeJwt({ hostId })
    apiClient.setToken(token)

    // Mock fetch to respond to GET /host/{id}
    // Expect the fetch url to be BASE_URL + VERSION + /host/{id}
    // @ts-ignore
    global.fetch.mockImplementation(async (url, opts) => {
      expect(String(url)).toContain(`${API_CONFIG.BASE_URL}${API_CONFIG.VERSION}/host/${hostId}`)
      // ensure Authorization header present and includes token
      expect(opts && (opts as any).headers && (opts as any).headers['Authorization']).toBe(`Bearer ${token}`)
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ _id: hostId, email: 'host@example.com', fullName: 'Host User' }),
      }
    })

    const res = await apiClient.getCurrentHost()
    expect(res.success).toBe(true)
  expect(res.data).toMatchObject({ _id: hostId, email: 'host@example.com' })
  })

  test('getCurrentUser decodes token and calls /users/{id}', async () => {
    const userId = '64f0b67f8c1b2a6d3c45e789'
    const token = makeFakeJwt({ userId })
    apiClient.setToken(token)

    // @ts-ignore
    global.fetch.mockImplementation(async (url, opts) => {
      expect(String(url)).toContain(`${API_CONFIG.BASE_URL}${API_CONFIG.VERSION}/users/${userId}`)
      expect(opts && (opts as any).headers && (opts as any).headers['Authorization']).toBe(`Bearer ${token}`)
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ _id: userId, email: 'player@example.com', fullName: 'Player One' }),
      }
    })

    const res = await apiClient.getCurrentUser()
    expect(res.success).toBe(true)
  expect(res.data).toMatchObject({ _id: userId, email: 'player@example.com' })
  })

  test('getCurrentUser falls back to /users/me when no id found in token', async () => {
    // No token set
    // @ts-ignore
    global.fetch.mockImplementation(async (url, opts) => {
      expect(String(url)).toContain(`${API_CONFIG.BASE_URL}${API_CONFIG.VERSION}/users/me`)
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ _id: 'legacy', email: 'legacy@example.com' }),
      }
    })

    const res = await apiClient.getCurrentUser()
    expect(res.success).toBe(true)
  expect(res.data).toMatchObject({ _id: 'legacy', email: 'legacy@example.com' })
  })
})
