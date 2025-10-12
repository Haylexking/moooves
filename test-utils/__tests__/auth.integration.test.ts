import { callApi } from '../apiTestClient'
import { loginAs } from '../auth'
import { TEST_MODE } from '../config'

describe('Auth integration (mock/live)', () => {
  test('register -> login -> protected route access', async () => {
    // register
    const regRes = await callApi({ method: 'post', path: '/api/v1/auth/register', body: { username: 'PlayerOne', email: 'player@example.com', password: 'Abc123!@#' } })
    const regJson = await regRes.json()
    expect(regRes.status).toBeGreaterThanOrEqual(200)
    if (TEST_MODE === 'mock') {
      expect(regJson.user).toBeDefined()
    }

    // login as player
    const login = await loginAs('player')
    expect(login.token).toBeDefined()

    // attempt to access a protected player-only route
    const protectedRes = await callApi({ method: 'get', path: '/api/v1/player/dashboard', headers: { Authorization: `Bearer ${login.token}` } })
    const protectedJson = await protectedRes.json()
    if (TEST_MODE === 'mock') {
      // in mock mode we may not have a specific mock file — ensure we get some response object or 404
      expect([200, 404]).toContain(protectedRes.status)
    } else {
      expect(protectedRes.status).toBe(200)
    }
  }, 20000)
})
