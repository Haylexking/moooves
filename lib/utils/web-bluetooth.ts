// Minimal Web Bluetooth helper. Note: Web Bluetooth is only available on secure contexts
// and supported browsers. This utility exposes connect, send, and onMessage hooks.

export interface BluetoothDeviceHandle {
  device: BluetoothDevice
  server: BluetoothRemoteGATTServer
  txChar?: BluetoothRemoteGATTCharacteristic
  rxChar?: BluetoothRemoteGATTCharacteristic
}

export async function requestBluetoothDevice(options?: { filters?: any[] } ) {
  if (!('bluetooth' in navigator)) throw new Error('Web Bluetooth not supported in this browser')

  const device = await (navigator as any).bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: ['0000180f-0000-1000-8000-00805f9b34fb'], // Battery service as example
    ...options,
  })

  return device as BluetoothDevice
}

export async function connectToDevice(device: BluetoothDevice): Promise<BluetoothDeviceHandle> {
  if (!device) throw new Error('Device not provided')

  const server = await device.gatt!.connect()

  // Example: try to read battery service (safe fallback)
  let txChar: BluetoothRemoteGATTCharacteristic | undefined
  let rxChar: BluetoothRemoteGATTCharacteristic | undefined

  try {
    const service = await server.getPrimaryService('battery_service')
    const char = await service.getCharacteristic('battery_level')
    // read once (cast to any because lib typings vary)
    try {
      await (char as any).readValue?.()
    } catch (e) {
      // ignore read errors
    }
  } catch (e) {
    // ignore if battery not available
  }

  return { device, server, txChar, rxChar }
}

export async function disconnect(handle?: BluetoothDeviceHandle) {
  try {
    if (!handle) return
    if (handle.server && handle.server.connected) handle.server.disconnect()
    handle.device?.gatt?.disconnect()
  } catch (e) {
    // ignore
  }
}

// Helper to subscribe to notifications from a characteristic
export async function subscribeCharacteristic(
  handle: BluetoothDeviceHandle,
  serviceUuid: string,
  charUuid: string,
  onMessage: (data: DataView) => void,
) {
  const service = await handle.server.getPrimaryService(serviceUuid)
  const char = await service.getCharacteristic(charUuid)
  await char.startNotifications()
  char.addEventListener('characteristicvaluechanged', (ev: any) => {
    onMessage(ev.target.value as DataView)
  })
  return char
}
