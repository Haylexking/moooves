import React from 'react'
import { render, act } from '@testing-library/react'

// We'll mount a component that uses the hook
import { useBluetoothConnection } from '@/lib/hooks/use-bluetooth-connection'

function TestComponent({ onReady }: { onReady?: (api: any) => void }) {
  const api = useBluetoothConnection()
  React.useEffect(() => {
    if (onReady) onReady(api)
  }, [api, onReady])
  return null
}

describe('useBluetoothConnection hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('connects and registers characteristicvaluechanged listener and handles incoming message', async () => {
    // Polyfill TextEncoder/TextDecoder in node/jest environment
    if (typeof (global as any).TextEncoder === 'undefined') {
      // simple polyfill using Buffer
      // @ts-ignore
      global.TextEncoder = class {
        encode(input: string) {
          return Uint8Array.from(Buffer.from(input, 'utf8'))
        }
      }
    }
    if (typeof (global as any).TextDecoder === 'undefined') {
      // simple polyfill using Buffer
      // @ts-ignore
      global.TextDecoder = class {
        decode(input: Uint8Array) {
          return Buffer.from(input).toString('utf8')
        }
      }
    }
    // Mock characteristic and device
    const listeners: Record<string, Function[]> = { 'characteristicvaluechanged': [] }

    const mockCharacteristic = {
      startNotifications: jest.fn(async () => {}),
      stopNotifications: jest.fn(async () => {}),
      addEventListener: jest.fn((event: string, handler: Function) => {
        if (!listeners[event]) listeners[event] = []
        listeners[event].push(handler)
      }),
      writeValue: jest.fn(async () => {}),
      removeEventListener: jest.fn((event: string, handler: Function) => {
        listeners[event] = listeners[event].filter((h) => h !== handler)
      }),
    }

    const mockService = { getCharacteristic: jest.fn(async () => mockCharacteristic) }

    const mockServer = { connect: jest.fn(async () => ({})), getPrimaryService: jest.fn(async () => mockService) }

    const mockDevice = {
      id: 'dev1',
      name: 'MOOOVES-DEV',
      gatt: {
        connect: jest.fn(async () => mockServer),
      },
      addEventListener: jest.fn((ev: string, cb: any) => {}),
    }

    // @ts-ignore - mocking browser Bluetooth API
    ;(global as any).navigator = (global.navigator as any) || {}
    ;(global.navigator as any).bluetooth = {
      requestDevice: jest.fn(async () => mockDevice) as any,
    }

    let apiRef: any = null

    await act(async () => {
      render(<TestComponent onReady={(api) => { apiRef = api }} />)
    })

    // Now call connectToDevice
    await act(async () => {
      await apiRef.connectToDevice({ id: 'dev1', name: 'MOOOVES-DEV', connected: false }, mockDevice)
    })

    // startNotifications should have been called
    expect(mockCharacteristic.startNotifications).toHaveBeenCalled()

    // Ensure server/service/characteristic resolution happened
    expect(mockServer.getPrimaryService).toHaveBeenCalledWith(expect.any(String))
    expect(mockService.getCharacteristic).toHaveBeenCalledWith(expect.any(String))
    // Ensure characteristic event registration was attempted
    expect(mockCharacteristic.addEventListener).toHaveBeenCalledWith(
      'characteristicvaluechanged',
      expect.any(Function),
    )

    // Register a message handler via onMessage
    const handler = jest.fn()
    const cleanup = apiRef.onMessage('move', handler)

  // Some JS runtimes used by the test runner may not populate our local `listeners` array
  // even though addEventListener was called. Rely on the recorded mock calls below to
  // retrieve the registered handler and simulate incoming events.

    // Simulate incoming characteristicvaluechanged event
    const encoder = new TextEncoder()
    const payload = JSON.stringify({ type: 'move', data: { row: 1, col: 2 }, timestamp: Date.now() })
    const value = encoder.encode(payload)

    // Create a fake event target with value
    const fakeEvent: any = { target: { value } }

    // Call registered listeners. Some environments may not have populated our `listeners` array
    // even though addEventListener was called; fall back to using the recorded mock call handler.
    act(() => {
      const registered = listeners['characteristicvaluechanged'] && listeners['characteristicvaluechanged'].length
        ? listeners['characteristicvaluechanged']
        : (mockCharacteristic.addEventListener.mock.calls.map(c => c[1]).filter(Boolean) as Function[])

      registered.forEach((fn) => fn(fakeEvent))
    })

    // Handler should be called with move data
    expect(handler).toHaveBeenCalledWith({ row: 1, col: 2 })

    // cleanup should remove the handler
    cleanup()
  })
})
