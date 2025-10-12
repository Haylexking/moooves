import { callApi } from './apiTestClient'
import { TEST_MODE } from './config'

export async function loginAs(role: 'player'|'host' = 'player') {
  if (TEST_MODE === 'mock') {
    if (role === 'player') return { token: 'mock-jwt-token-player', user: { id: 'mock-user-1', role: 'player' } }
    return { token: 'mock-jwt-token-host', user: { id: 'mock-host-1', role: 'host' } }
  }

  // live mode: call login endpoint
  const res = await callApi({ method: 'post', path: '/api/v1/auth/login', body: { email: `${role}@example.com`, password: 'password' } })
  const json = await res.json()
  return { token: json.token, user: json.user }
}
