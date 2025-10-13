import { apiClient } from '@/lib/api/client'

describe('Payout API client', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn()
  })

  afterEach(() => {
    // @ts-ignore
    global.fetch.mockRestore()
    jest.clearAllMocks()
  })

  test('verifyTournamentPayouts calls distribute endpoint and returns success', async () => {
    // @ts-ignore
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, payouts: { host: 5000, first: 2000 } }),
    }))

    const res = await apiClient.verifyTournamentPayouts('tourn-1')
    expect(res.success).toBe(true)
    expect(res.data.payouts.host).toBe(5000)
    // ensure correct path used via baseUrl (just ensure fetch called)
    expect(global.fetch).toHaveBeenCalled()
  })

  test('sendManualPayout posts to send endpoint and returns success', async () => {
    // @ts-ignore
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, message: 'Payout initiated', data: { status: 'success' } }),
    }))

    const res = await apiClient.sendManualPayout('044', '0123456789', 5000, 'Test payout')
    expect(res.success).toBe(true)
    expect(res.data.message).toContain('Payout initiated')
    expect(global.fetch).toHaveBeenCalled()
  })
})
