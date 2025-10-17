"use client"

import React, { useState } from 'react'
import { createPeerConnection } from '@/lib/utils/webrtc'
import { requestBluetoothDevice, connectToDevice, disconnect, subscribeCharacteristic } from '@/lib/utils/web-bluetooth'

export function LocalPeerConnection() {
  const [localSdp, setLocalSdp] = useState('')
  const [remoteSdp, setRemoteSdp] = useState('')
  const [messages, setMessages] = useState<string[]>([])
  const [pcHandle, setPcHandle] = useState<any>(null)
  const [btDevice, setBtDevice] = useState<any>(null)

  const log = (m: string) => setMessages((s) => [...s, m])

  const startOffer = async () => {
    const pc = createPeerConnection({
      onData: (m) => log(`remote: ${m}`),
      onState: (s) => log(`state: ${s}`),
    })
    setPcHandle(pc)
    const offer = await pc.createOffer()
    setLocalSdp(offer)
  }

  const createAnswer = async () => {
    try {
      const pc = createPeerConnection({
        onData: (m) => log(`remote: ${m}`),
        onState: (s) => log(`state: ${s}`),
      })
      const answer = await pc.createAnswer(remoteSdp)
      setPcHandle(pc)
      setLocalSdp(answer)
    } catch (e: any) {
      log(`error: ${String(e)}`)
    }
  }

  const acceptRemote = async () => {
    if (!pcHandle) return log('No peer connection to accept remote SDP')
    try {
      await pcHandle.acceptAnswer(remoteSdp)
      log('Accepted remote SDP')
    } catch (e: any) {
      log(`error: ${String(e)}`)
    }
  }

  const sendMessage = () => {
    if (!pcHandle) return log('No connection')
    try {
      pcHandle.sendMessage('Hello from local peer')
      log('sent: Hello from local peer')
    } catch (e: any) {
      log(`send error: ${String(e)}`)
    }
  }

  const handleRequestBluetooth = async () => {
    try {
      const device = await requestBluetoothDevice()
      log(`Selected device: ${device.name || device.id}`)
      const h = await connectToDevice(device)
      setBtDevice(h)
      log('Bluetooth connected')
    } catch (e: any) {
      log(`BT error: ${String(e)}`)
    }
  }

  const handleDisconnectBluetooth = async () => {
    try {
      await disconnect(btDevice)
      setBtDevice(null)
      log('Bluetooth disconnected')
    } catch (e: any) {
      log(`BT disconnect error: ${String(e)}`)
    }
  }

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold">Local Peer (WebRTC) & Bluetooth</h3>

      <div className="mt-2">
        <button onClick={startOffer} className="mr-2">Create Offer</button>
        <button onClick={createAnswer} className="mr-2">Create Answer from Remote SDP</button>
        <button onClick={acceptRemote} className="mr-2">Accept Remote SDP</button>
        <button onClick={sendMessage}>Send Test Message</button>
      </div>

      <div className="mt-3">
        <label>Local SDP</label>
        <textarea value={localSdp} onChange={(e) => setLocalSdp(e.target.value)} rows={6} className="w-full" />
      </div>

      <div className="mt-3">
        <label>Remote SDP</label>
        <textarea value={remoteSdp} onChange={(e) => setRemoteSdp(e.target.value)} rows={6} className="w-full" />
      </div>

      <div className="mt-3">
        <button onClick={handleRequestBluetooth} className="mr-2">Request Bluetooth Device</button>
        <button onClick={handleDisconnectBluetooth}>Disconnect Bluetooth</button>
      </div>

      <div className="mt-3">
        <h4 className="font-semibold">Log</h4>
        <div className="max-h-40 overflow-auto bg-black/5 p-2">
          {messages.map((m, i) => (
            <div key={i} className="text-sm">{m}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LocalPeerConnection
