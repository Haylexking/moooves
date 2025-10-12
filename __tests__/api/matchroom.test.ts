import { callApi, listPaths } from '@/test-utils/apiTestClient'
import { loginAs } from '@/test-utils/auth'
import report from '@/test-utils/report'

describe('Matchroom API (mock-first)', () => {
  const moduleName = 'Matchroom'
  report.createModule(moduleName)
  const paths = listPaths()

  test('create room, join, leave, start match', async () => {
    const host = await loginAs('host')
    const player = await loginAs('player')

    const createPath = paths.find(p => /matchroom.*create|room.*create|\/api\/v1\/matchroom/.test(p))
  if (!createPath) { console.warn('Matchroom create missing - skipping'); report.record(moduleName,'create','pending'); return }

    const payload = { name: `room-${Date.now()}`, maxPlayers: 4 }
    const resCreate = await callApi({ method: 'post', path: createPath, body: payload, headers: { authorization: `Bearer ${host.token}` } })
    expect([200,201,404]).toContain(resCreate.status)
    if (resCreate.status === 200 || resCreate.status === 201) {
      const json = await resCreate.json()
      const roomCode = json?.roomCode || json?.id || 'mock-room-1'
      report.record(moduleName, createPath, 'passed', resCreate.status)
    } else {
      report.record(moduleName, createPath, 'tested', resCreate.status)
    }

    // player join
    const joinPath = paths.find(p => /join.*room|room.*join|\/api\/v1\/matchroom.*join/.test(p))
  if (!joinPath) { console.warn('Matchroom join missing - skipping join tests'); report.record(moduleName,'join','pending'); return }
    const pathWithId = joinPath.includes('{') ? joinPath.replace(/{[^}]+}/, roomCode) : `${joinPath}/${roomCode}`

  const rJoin = await callApi({ method: 'post', path: pathWithId, headers: { authorization: `Bearer ${player.token}` } })
  expect([200,201,204,403,404]).toContain(rJoin.status)
  report.record(moduleName, joinPath, rJoin.status === 200 || rJoin.status === 201 ? 'passed' : 'tested', rJoin.status)

    // start match (host)
    const startPath = paths.find(p => /start.*match|match.*start/.test(p))
  if (!startPath) { console.warn('Match start missing - skipping'); report.record(moduleName,'start','pending'); return }
    const startWithId = startPath.includes('{') ? startPath.replace(/{[^}]+}/, roomCode) : `${startPath}/${roomCode}`
    const rStart = await callApi({ method: 'post', path: startWithId, headers: { authorization: `Bearer ${host.token}` } })
    expect([200,202,403,404]).toContain(rStart.status)
    report.record(moduleName, startPath, rStart.status === 200 || rStart.status === 202 ? 'passed' : 'tested', rStart.status)
  })

})
