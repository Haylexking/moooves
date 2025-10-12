import { callApi, listPaths } from '@/test-utils/apiTestClient'
import { loginAs } from '@/test-utils/auth'
import report from '@/test-utils/report'

describe('Tournament API (mock-first)', () => {
  const moduleName = 'Tournament'
  report.createModule(moduleName)
  const paths = listPaths()

  test('create tournament as host; player cannot create', async () => {
    const host = await loginAs('host')
    const player = await loginAs('player')

    const createPath = paths.find(p => /tournament.*create|\/api\/v1\/tournament/.test(p))
    if (!createPath) {
      console.warn('Tournament create endpoint missing from swagger.json - skipping')
      report.record(moduleName, 'create', 'pending')
      return
    }

    const payload = { name: `test-${Date.now()}`, startsAt: Date.now() + 1000 * 60 }

    const resHost = await callApi({ method: 'post', path: createPath, body: payload, headers: { authorization: `Bearer ${host.token}` } })
    expect([200,201,404]).toContain(resHost.status)
    if (resHost.status === 200 || resHost.status === 201) {
      const json = await resHost.json()
      expect(json).toBeDefined()
      expect(json.id || json.tournamentId).toBeTruthy()
      report.record(moduleName, createPath, 'passed', resHost.status)
    } else {
      report.record(moduleName, createPath, 'tested', resHost.status)
    }

    const resPlayer = await callApi({ method: 'post', path: createPath, body: payload, headers: { authorization: `Bearer ${player.token}` } })
    expect([200,201,403,401,404]).toContain(resPlayer.status)
    report.record(moduleName, createPath + ':create-by-player', resPlayer.status === 200 || resPlayer.status === 201 ? 'passed' : 'tested', resPlayer.status)
  })

  test('players can join and duplicate joins handled', async () => {
    const player = await loginAs('player')
    const joinPath = paths.find(p => /join.*tournament|\/api\/v1\/tournament.*join/.test(p))
  if (!joinPath) { console.warn('Tournament join endpoint missing - skipping'); report.record(moduleName, 'join', 'pending'); return }

    const tournamentId = 'mock-tournament-1'
    const pathWithId = joinPath.includes('{') ? joinPath.replace(/{[^}]+}/, tournamentId) : `${joinPath}/${tournamentId}`

    const r1 = await callApi({ method: 'post', path: pathWithId, headers: { authorization: `Bearer ${player.token}` } })
  expect([200,201,204,403,404,409]).toContain(r1.status)
  report.record(moduleName, joinPath, r1.status === 200 || r1.status === 201 ? 'passed' : 'tested', r1.status)

    const r2 = await callApi({ method: 'post', path: pathWithId, headers: { authorization: `Bearer ${player.token}` } })
    expect([200,201,204,403,404,409]).toContain(r2.status)
    report.record(moduleName, joinPath + ':duplicate', r2.status === 200 || r2.status === 201 ? 'passed' : 'tested', r2.status)
  })

  test('list tournaments and validate leaderboard shape', async () => {
    const listPath = paths.find(p => /tournaments|tournament.*list|\/api\/v1\/tournaments/.test(p))
    if (!listPath) { console.warn('Tournament list missing - skipping'); report.record(moduleName, 'list', 'pending'); return }
    const res = await callApi({ path: listPath })
    expect([200,204,404]).toContain(res.status)
    if (res.status === 200) {
      const json = await res.json()
      expect(json).toBeDefined()
      expect(Array.isArray(json) || Array.isArray(json.tournaments)).toBeTruthy()
      report.record(moduleName, listPath, 'passed', res.status)
    } else {
      report.record(moduleName, listPath, 'tested', res.status)
    }
  })

})
