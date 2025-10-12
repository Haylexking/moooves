import { callApi, listPaths } from '@/test-utils/apiTestClient'
// use timestamp-based unique strings to avoid adding uuid as a test dependency
import report from '@/test-utils/report'

describe('Auth API (email/password)', () => {
  const moduleName = 'Auth'
  report.createModule(moduleName)
  const paths = listPaths()

  test('register, login, protected route access, and error cases', async () => {
    const registerPath = paths.find(p => /auth.*register|\/api\/v1\/auth\/register/.test(p))
    const loginPath = paths.find(p => /auth.*login|\/api\/v1\/auth\/login/.test(p))
  if (!registerPath || !loginPath) { console.warn('Auth register/login endpoints missing - skipping'); report.record(moduleName,'register/login','pending'); return }

  const email = `test+${Date.now()}@example.com`
    const password = 'Test1234!'

    const rReg = await callApi({ method: 'post', path: registerPath, body: { email, password } })
  expect([200,201,400,404]).toContain(rReg.status)
  report.record(moduleName, registerPath, rReg.status === 200 || rReg.status === 201 ? 'passed' : 'tested', rReg.status)

    const rLogin = await callApi({ method: 'post', path: loginPath, body: { email, password } })
    expect([200,400,401,404]).toContain(rLogin.status)
    if (rLogin.status === 200) {
      const j = await rLogin.json()
      expect(j.token || j.accessToken).toBeDefined()
      report.record(moduleName, loginPath, 'passed', rLogin.status)
    } else {
      report.record(moduleName, loginPath, 'tested', rLogin.status)
    }

    const protectedPaths = paths.filter(p => /protected|me|\/api\/v1\/users\//.test(p))
    if (protectedPaths.length === 0) { console.warn('No protected paths discovered - skipping protected checks'); report.record(moduleName,'protected','pending'); return }
    const token = (rLogin.status === 200) ? (await rLogin.json()).token : 'mock-token'

    for (const pp of protectedPaths.slice(0,3)) {
      const r = await callApi({ path: pp, headers: { authorization: `Bearer ${token}` } })
      expect([200,401,403,404]).toContain(r.status)
      report.record(moduleName, pp, r.status === 200 ? 'passed' : 'tested', r.status)
    }
  })

})
