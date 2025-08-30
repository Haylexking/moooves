"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { Move } from "@/lib/types"

interface BluetoothDevice {
  id: string
  name: string
  connected: boolean
}

interface BluetoothConnectionState {
  isSupported: boolean
  isScanning: boolean
  isConnected: boolean
  connectedDevice: BluetoothDevice | null
  availableDevices: BluetoothDevice[]
  error: string | null
}

interface BluetoothMessage {
  type: "move" | "game_start" | "game_end" | "ping"
  data: any
  timestamp: number
}

// MOOOVES Bluetooth service UUID (custom generated)
const MOOOVES_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
const MOOOVES_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"

export function useBluetoothConnection() {
  const [state, setState] = useState<BluetoothConnectionState>({
    isSupported: typeof navigator !== "undefined" && "bluetooth" in navigator,
    isScanning: false,
    isConnected: false,
    connectedDevice: null,
    availableDevices: [],
    error: null,
  })

  const deviceRef = useRef<BluetoothDevice | null>(null)
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null)
  const messageHandlersRef = useRef<Map<string, (data: any) => void>>(new Map())

  // Check if Web Bluetooth is supported
  const checkSupport = useCallback(() => {
    const supported = typeof navigator !== "undefined" && "bluetooth" in navigator
    setState((prev) => ({ ...prev, isSupported: supported }))

    if (!supported) {
      setState((prev) => ({
        ...prev,
        error: "Bluetooth not supported. Try Chrome on Android or enable experimental features.",
      }))
    }

    return supported
  }, [])

  // Handle incoming messages from opponent
  const handleIncomingMessage = useCallback((event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic
    const value = target.value
    if (!value) return

    try {
      const decoder = new TextDecoder()
      const messageData: BluetoothMessage = JSON.parse(decoder.decode(value))

      // Route message to appropriate handler
      const handler = messageHandlersRef.current.get(messageData.type)
      if (handler) {
        handler(messageData.data)
      }
    } catch (error) {
      console.error("Failed to parse incoming Bluetooth message:", error)
      setState((prev) => ({
        ...prev,
        error: "Failed to parse message from opponent",
      }))
    }
  }, [])

  // Scan for nearby MOOOVES players
  const scanForDevices = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: "Bluetooth not supported on this device",
      }))
      return
    }

    setState((prev) => ({ ...prev, isScanning: true, error: null }))

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [MOOOVES_SERVICE_UUID] }, { namePrefix: "MOOOVES" }],
        optionalServices: [MOOOVES_SERVICE_UUID],
      })

      if (device && device.name) {
        const bluetoothDevice: BluetoothDevice = {
          id: device.id,
          name: device.name,
          connected: false,
        }

        setState((prev) => ({
          ...prev,
          availableDevices: [bluetoothDevice], // Replace previous for simplicity
          isScanning: false,
        }))

        // Auto-connect to selected device
        await connectToDevice(bluetoothDevice, device)
      }
    } catch (error: any) {
      let errorMessage = "Failed to scan for devices"

      if (error.name === "NotFoundError") {
        errorMessage = "No MOOOVES players found nearby"
      } else if (error.name === "SecurityError") {
        errorMessage = "Bluetooth access denied. Please allow Bluetooth permissions."
      }

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isScanning: false,
      }))
    }
  }, [state.isSupported])

  // Connect to a specific device
  const connectToDevice = useCallback(
    async (bluetoothDevice: BluetoothDevice, nativeDevice?: BluetoothDevice) => {
      setState((prev) => ({ ...prev, error: null }))

      try {
        let device = nativeDevice

        if (!device) {
          device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [MOOOVES_SERVICE_UUID] }],
          })
        }

        // Connect to GATT server
        const server = await device.gatt?.connect()
        if (!server) throw new Error("Failed to connect to device")

        // Get MOOOVES service
        const service = await server.getPrimaryService(MOOOVES_SERVICE_UUID)
        const characteristic = await service.getCharacteristic(MOOOVES_CHARACTERISTIC_UUID)

        characteristicRef.current = characteristic

        // Start listening for messages
        await characteristic.startNotifications()
        characteristic.addEventListener("characteristicvaluechanged", handleIncomingMessage)

        // Handle disconnection
        device.addEventListener("gattserverdisconnected", () => {
          setState((prev) => ({
            ...prev,
            isConnected: false,
            connectedDevice: null,
            error: "Device disconnected",
          }))
          characteristicRef.current = null
        })

        setState((prev) => ({
          ...prev,
          isConnected: true,
          connectedDevice: {
            ...bluetoothDevice,
            connected: true,
          },
        }))

        // Send connection confirmation
        await sendMessage("ping", { message: "Connected to MOOOVES" })
      } catch (error: any) {
        let errorMessage = "Failed to connect to device"

        if (error.name === "NetworkError") {
          errorMessage = "Device is not available or out of range"
        } else if (error.name === "SecurityError") {
          errorMessage = "Connection blocked. Please try again."
        }

        setState((prev) => ({
          ...prev,
          error: errorMessage,
        }))
      }
    },
    [handleIncomingMessage],
  )

  // Send message to opponent
  const sendMessage = useCallback(
    async (type: BluetoothMessage["type"], data: any) => {
      if (!characteristicRef.current || !state.isConnected) {
        throw new Error("Not connected to any device")
      }

      try {
        const message: BluetoothMessage = {
          type,
          data,
          timestamp: Date.now(),
        }

        const encoder = new TextEncoder()
        const encodedData = encoder.encode(JSON.stringify(message))

        // Bluetooth LE has a 20-byte limit per packet, so we might need to chunk
        const maxChunkSize = 20
        if (encodedData.length <= maxChunkSize) {
          await characteristicRef.current.writeValue(encodedData)
        } else {
          // Send in chunks (simplified implementation)
          for (let i = 0; i < encodedData.length; i += maxChunkSize) {
            const chunk = encodedData.slice(i, i + maxChunkSize)
            await characteristicRef.current.writeValue(chunk)
            // Small delay between chunks
            await new Promise((resolve) => setTimeout(resolve, 10))
          }
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: "Failed to send message to opponent",
        }))
        throw error
      }
    },
    [state.isConnected],
  )

  // Send move to opponent
  const sendMove = useCallback(
    async (move: Move) => {
      await sendMessage("move", move)
    },
    [sendMessage],
  )

  // Register message handler
  const onMessage = useCallback((type: BluetoothMessage["type"], handler: (data: any) => void) => {
    messageHandlersRef.current.set(type, handler)

    // Return cleanup function
    return () => {
      messageHandlersRef.current.delete(type)
    }
  }, [])

  // Disconnect from device
  const disconnect = useCallback(async () => {
    try {
      if (characteristicRef.current) {
        await characteristicRef.current.stopNotifications()
        characteristicRef.current.removeEventListener("characteristicvaluechanged", handleIncomingMessage)
        characteristicRef.current = null
      }

      if (state.connectedDevice) {
        // The device will auto-disconnect when we close the connection
        setState((prev) => ({
          ...prev,
          isConnected: false,
          connectedDevice: null,
          availableDevices: [],
        }))
      }
    } catch (error) {
      console.error("Error disconnecting Bluetooth:", error)
    }
  }, [state.connectedDevice, handleIncomingMessage])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    ...state,
    checkSupport,
    scanForDevices,
    connectToDevice,
    sendMove,
    sendMessage,
    onMessage,
    disconnect,
  }
}
