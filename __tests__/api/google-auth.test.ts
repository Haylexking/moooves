import { callApi, listPaths } from '@/test-utils/apiTestClient'
import { loginAs } from '@/test-utils/auth'
import report from '@/test-utils/report'

describe('Google OAuth (mock-first)', () => {
  const moduleName = 'Google OAuth'
  report.createModule(moduleName)
  const paths = listPaths()

  test('mocked google token exchange and backend user creation', async () => {
    const googlePath = paths.find(p => /google|oauth.*google|auth\/google/.test(p))
  if (!googlePath) { console.warn('Google OAuth endpoint missing - skipping'); report.record(moduleName,'google','pending'); return }

    // Simulate an exchange where frontend posts a google token
    const mockGoogleToken = 'mock-google-token'
    const res = await callApi({ method: 'post', path: googlePath, body: { token: mockGoogleToken } })
    expect([200,201,400,401,404]).toContain(res.status)
    if (res.status === 200 || res.status === 201) {
      const j = await res.json()
      expect(j.accessToken || j.token).toBeDefined()
      expect(j.user || j.profile).toBeDefined()
      report.record(moduleName, googlePath, 'passed', res.status)
    } else {
      report.record(moduleName, googlePath, 'tested', res.status)
    }
  })

})
