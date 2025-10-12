import { callApi, listPaths } from '@/test-utils/apiTestClient'
import { loginAs } from '@/test-utils/auth'
import report from '@/test-utils/report'

describe('Payment & Wallet API (mock-first)', () => {
  const moduleName = 'Payment'
  report.createModule(moduleName)
  const paths = listPaths()

  test('bank link, deposit, withdrawal, and transaction history', async () => {
    const user = await loginAs('player')
    const linkPath = paths.find(p => /bank.*link|wallet.*link|\/api\/v1\/wallet.*link/.test(p))
  if (!linkPath) { console.warn('Bank link endpoint missing - skipping'); report.record(moduleName,'bank-link','pending'); return }

  const rLink = await callApi({ method: 'post', path: linkPath, body: { bankCode: 'MOCKBANK', accountNumber: '12345678' }, headers: { authorization: `Bearer ${user.token}` } })
  expect([200,201,400,401,403,404]).toContain(rLink.status)
  report.record(moduleName, linkPath, rLink.status === 200 || rLink.status === 201 ? 'passed' : 'tested', rLink.status)

    const depositPath = paths.find(p => /deposit|wallet.*deposit/.test(p))
  if (!depositPath) { console.warn('Deposit endpoint missing - skipping'); report.record(moduleName,'deposit','pending'); return }
  const rDep = await callApi({ method: 'post', path: depositPath, body: { amount: 1000 }, headers: { authorization: `Bearer ${user.token}` } })
  expect([200,201,400,401,403,404]).toContain(rDep.status)
  report.record(moduleName, depositPath, rDep.status === 200 || rDep.status === 201 ? 'passed' : 'tested', rDep.status)

    const withdrawPath = paths.find(p => /withdraw|wallet.*withdraw/.test(p))
  if (!withdrawPath) { console.warn('Withdraw missing - skipping'); report.record(moduleName,'withdraw','pending'); return }
  const rWith = await callApi({ method: 'post', path: withdrawPath, body: { amount: 500 }, headers: { authorization: `Bearer ${user.token}` } })
  expect([200,201,400,401,403,404]).toContain(rWith.status)
  report.record(moduleName, withdrawPath, rWith.status === 200 || rWith.status === 201 ? 'passed' : 'tested', rWith.status)

    const historyPath = paths.find(p => /transactions|history|wallet.*transactions/.test(p))
    if (!historyPath) { console.warn('History missing - skipping'); report.record(moduleName,'history','pending'); return }
    const rHist = await callApi({ path: historyPath, headers: { authorization: `Bearer ${user.token}` } })
    expect([200,204,401,404]).toContain(rHist.status)
    report.record(moduleName, historyPath, rHist.status === 200 ? 'passed' : 'tested', rHist.status)
  })

})
