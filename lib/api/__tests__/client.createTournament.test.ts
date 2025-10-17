import { apiClient } from '@/lib/api/client'

describe('ApiClient.createTournament request shape', () => {
  let spy: jest.SpyInstance

  beforeEach(() => {
    spy = jest.spyOn(apiClient as any, 'request').mockResolvedValue({ success: true, data: { tournament: { id: 't1' } } })
  })

  afterEach(() => {
    spy.mockRestore()
  })

  test('sends createdBy and entryfee fields to /tournaments', async () => {
    const payload = { name: 'My Cup', organizerId: 'host-42', maxPlayers: 16, entryFee: 1500 }

    await apiClient.createTournament(payload as any)

    expect(spy).toHaveBeenCalled()
    const [endpoint, options] = spy.mock.calls[0]
    expect(endpoint).toBe('/tournaments')

    // body is serialized JSON
    const body = JSON.parse(options.body)
    expect(body.name).toBe('My Cup')
    // swagger expects `createdBy` and `entryfee`
    expect(body.createdBy).toBe('host-42')
    expect(body.entryfee).toBe(1500)
    // keep backwards compatibility: organizerId also present
    expect(body.organizerId).toBe('host-42')
  })
})
