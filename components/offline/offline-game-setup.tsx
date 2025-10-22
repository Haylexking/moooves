"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useBluetoothConnection } from "@/lib/hooks/use-bluetooth-connection"
import { useWiFiConnection } from "@/lib/hooks/use-wifi-connection"
import { useMatchRoom } from "@/lib/hooks/use-match-room"
import { Bluetooth, Wifi, Users, Smartphone, AlertCircle, CheckCircle, Copy, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button as UiButton } from "@/components/ui/button"
import { apiClient } from "@/lib/api/client"

export function OfflineGameSetup() {
  const [roomCode, setRoomCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const bluetooth = useBluetoothConnection()
  const wifi = useWiFiConnection()
  const matchRoom = useMatchRoom()

  // Register to receive invite tokens through local channels. We don't auto-join;
  // instead we surface a confirmation to the user (COD confirm) and call joinRoom
  // only after explicit user consent.
  const [inviteOpen, setInviteOpen] = useState(false)
  const [pendingInvite, setPendingInvite] = useState<any>(null)

  useEffect(() => {
    // Bluetooth invite handler
    const offBt = bluetooth.onMessage("ping", async (data: any) => {
      const token = data?.inviteToken || data?.token || null
      if (!token) return

      // Try to derive roomId/roomCode from token heuristics — backend may return full object
      const payload = { token: String(token), source: 'bluetooth' as const }

      // Emit invite to matchRoom so other UI can respond
      if ((matchRoom as any).emitInvite) {
        ;(matchRoom as any).emitInvite(payload)
      }

      // Open our in-app invite modal (non-blocking)
      setPendingInvite({ ...payload })
      setInviteOpen(true)
    })

    // WiFi invite handler: data channel messages may carry inviteToken under ping as well
    const offWifi = wifi.onMessage("ping", async (data: any) => {
      const token = data?.inviteToken || data?.token || null
      if (!token) return

      const payload = { token: String(token), source: 'wifi' as const }
      if ((matchRoom as any).emitInvite) {
        ;(matchRoom as any).emitInvite(payload)
      }
      setPendingInvite({ ...payload })
      setInviteOpen(true)
    })

    return () => {
      offBt?.()
      offWifi?.()
    }
  }, [bluetooth, wifi, matchRoom])

  // Handler when user confirms invite in modal
  const handleAcceptInvite = async () => {
    if (!pendingInvite) return
    setInviteOpen(false)
    try {
      const token = pendingInvite.token
      const rooms = await apiClient.getAllMatchRooms()
      const target = rooms.data?.find((r: any) => {
        const code = r.roomCode || r.code || r.roomId || r._id || r.id
        const bt = r.bluetoothToken || r.handshakeToken
        return code === token || String(bt) === token || (bt && String(bt).includes(String(token)))
      })
      if (target) {
        const handshakeToken = target.handshakeToken || target.bluetoothToken || token
        await matchRoom.joinRoom(target.id || target._id || target.roomId, handshakeToken)
      } else {
        // No matching room
        // Could use app toast; keep it simple here
        alert('Invite token received but no matching game found on server')
      }
    } catch (err) {
      console.error('Failed to join after invite', err)
    } finally {
      setPendingInvite(null)
    }
  }

  const handleDeclineInvite = () => {
    setInviteOpen(false)
    setPendingInvite(null)
  }

  // Copy room code to clipboard
  const copyRoomCode = async () => {
    if (wifi.roomCode) {
      try {
        await navigator.clipboard.writeText(wifi.roomCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error("Failed to copy room code:", error)
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement("textarea")
        textArea.value = wifi.roomCode
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  // Check support on mount
  useEffect(() => {
    bluetooth.checkSupport()
  }, [bluetooth])

  const handleBluetoothScan = async () => {
    try {
      setRetryCount(0)
      await bluetooth.scanForDevices()
      if (bluetooth.isConnected && bluetooth.connectedDevice) {
        // Create room on backend; backend returns a bluetoothToken which we should share with peer
        const created = await matchRoom.createRoom()
        // Prefer short roomCode for BLE to avoid JSON chunking; fallback to roomId, then bluetoothToken
        const tokenToShare = created?.roomCode || created?.roomId || created?.bluetoothToken
        if (tokenToShare) {
          // Send token over Bluetooth to peer so they can call joinMatchRoom with handshakeToken
          try {
            await bluetooth.sendMessage("ping", { inviteToken: tokenToShare })
          } catch (err) {
            console.warn("Failed to send token over Bluetooth", err)
          }
        }
      }
    } catch (error) {
      console.error("Bluetooth scan failed:", error)
    }
  }

  const handleWiFiHost = async () => {
    try {
      setRetryCount(0)
      const wifiRoomCode = await wifi.hostGame()
      if (wifiRoomCode) {
        const created = await matchRoom.createRoom()
        const tokenToShare = created?.roomCode || created?.roomId || created?.bluetoothToken
        // For WiFi, we treat roomCode as the visible code; the backend may also return a handshake token
        if (tokenToShare && wifi.roomCode) {
          // nothing extra to do - wifi.roomCode is already visible to host
        }
      }
    } catch (error) {
      console.error("Failed to host game:", error)
      setRetryCount((prev) => prev + 1)
    }
  }

  const handleWiFiJoin = async () => {
    const code = roomCode.trim()
    if (!code) return

    try {
      setRetryCount(0)
      const upper = code.toUpperCase()
      const isLocalShortCode = /^[A-Z0-9]{6}$/.test(upper)

      if (isLocalShortCode) {
        // Local WiFi signalling flow
        await wifi.joinGame(upper)
      }

      // Try to resolve against backend rooms as well
      const rooms = await apiClient.getAllMatchRooms()
      const targetRoom = rooms.data?.find((room: any) => {
        const id = room.id || room._id || room.roomId
        const rc = room.roomCode || room.code || id
        const bt = room.bluetoothToken || room.handshakeToken
        return (
          String(id) === code ||
          String(rc).toUpperCase() === upper ||
          (bt && String(bt).toUpperCase().includes(upper))
        )
      })
      if (targetRoom) {
        const handshakeToken = targetRoom.handshakeToken || targetRoom.bluetoothToken || ""
        await matchRoom.joinRoom(targetRoom.id || targetRoom._id || targetRoom.roomId, handshakeToken)
      } else if (!isLocalShortCode) {
        throw new Error('No matching backend room found for the provided token')
      }
    } catch (error) {
      console.error("Failed to join game:", error)
      setRetryCount((prev) => prev + 1)
    }
  }

  const handleRetry = () => {
    if (wifi.error) {
      wifi.disconnect()
      setTimeout(() => {
        if (wifi.roomCode) {
          handleWiFiHost()
        }
      }, 1000)
    }
    if (bluetooth.error) {
      bluetooth.disconnect()
      setTimeout(() => {
        handleBluetoothScan()
      }, 1000)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Offline Play</h1>
        <p className="text-gray-600">Play with friends nearby via Bluetooth or WiFi</p>
      </div>

      <Tabs defaultValue="wifi" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="wifi" className="flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            WiFi
          </TabsTrigger>
          <TabsTrigger value="bluetooth" className="flex items-center gap-2">
            <Bluetooth className="w-4 h-4" />
            Bluetooth
          </TabsTrigger>
        </TabsList>

        {/* WiFi Connection */}
        <TabsContent value="wifi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                WiFi Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!wifi.isSupported && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    WiFi connection not supported on this browser. Try Chrome or Firefox.
                  </AlertDescription>
                </Alert>
              )}

              {wifi.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{wifi.error}</span>
                    {retryCount < 3 && (
                      <Button size="sm" variant="outline" onClick={handleRetry} className="ml-2 bg-transparent">
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Retry
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {wifi.roomCode && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Room Code: {wifi.roomCode}</p>
                        <p className="text-sm">Share this code with your opponent</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={copyRoomCode} className="ml-2 bg-transparent">
                        {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Host Game
                  </h3>
                  <p className="text-sm text-gray-600">Create a room for others to join</p>
                  <Button
                    onClick={handleWiFiHost}
                    disabled={!wifi.isSupported || wifi.isHosting || wifi.roomCode !== null}
                    className="w-full"
                  >
                    {wifi.isHosting ? "Creating Room..." : wifi.roomCode ? "Room Created" : "Host Game"}
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Join Game
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="roomCode">Room Code or Token</Label>
                    <Input
                      id="roomCode"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      placeholder="Enter code or token"
                      maxLength={64}
                      disabled={wifi.isConnected}
                    />
                  </div>
                  <Button
                    onClick={handleWiFiJoin}
                    disabled={!wifi.isSupported || !roomCode.trim() || wifi.isConnected}
                    className="w-full"
                  >
                    {wifi.isConnected ? "Connected" : "Join Game"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bluetooth Connection */}
        <TabsContent value="bluetooth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bluetooth className="w-5 h-5" />
                Bluetooth Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!bluetooth.isSupported && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Bluetooth not supported. Use Chrome on Android or enable experimental Web Bluetooth.
                  </AlertDescription>
                </Alert>
              )}

              {bluetooth.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{bluetooth.error}</span>
                    {retryCount < 3 && (
                      <Button size="sm" variant="outline" onClick={handleRetry} className="ml-2 bg-transparent">
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Retry
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Make sure both players have MOOOVES open and Bluetooth enabled
                  </p>
                  <Button
                    onClick={handleBluetoothScan}
                    disabled={!bluetooth.isSupported || bluetooth.isScanning || bluetooth.isConnected}
                    className="w-full"
                  >
                    {bluetooth.isScanning ? "Scanning..." : bluetooth.isConnected ? "Connected" : "Find Opponent"}
                  </Button>
                </div>

                {bluetooth.availableDevices.length > 0 && !bluetooth.isConnected && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Available Players</h3>
                    {bluetooth.availableDevices.map((device) => (
                      <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <span>{device.name}</span>
                        <Button size="sm" onClick={() => bluetooth.connectToDevice(device)} disabled={device.connected}>
                          {device.connected ? "Connected" : "Connect"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {bluetooth.connectedDevice && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Connected to: {bluetooth.connectedDevice.name}</p>
                          <p className="text-sm">Ready to play!</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={bluetooth.disconnect} className="bg-transparent">
                          Disconnect
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Connection Status & Game Start */}
      {(wifi.isConnected || bluetooth.isConnected) && (
        <Card className="mt-6">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">Connected!</h3>
            <p className="text-green-700 mb-4">
              Connected via {wifi.isConnected ? "WiFi" : "Bluetooth"}.
              {matchRoom.roomId && ` Match room: ${matchRoom.roomId.slice(-6)}`}
            </p>
            <Button className="w-full" size="lg" onClick={() => (window.location.href = "/offline/play")}>
              Start Game
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">How it works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>WiFi:</strong> One player hosts and shares the room code. The other joins using the code.
          </p>
          <p>
            <strong>Bluetooth:</strong> Both players scan for each other. Works best when devices are close (within 10
            meters).
          </p>
          <p>
            <strong>Note:</strong> Both methods work without internet once connected.
          </p>
          <p>
            <strong>Troubleshooting:</strong> If connection fails, try moving closer together and ensure both devices
            have the app open.
          </p>
        </CardContent>
      </Card>

      {/* Invite confirmation modal (non-blocking) */}
      <Dialog open={inviteOpen} onOpenChange={(v) => { if (!v) handleDeclineInvite(); setInviteOpen(v) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Game Invite</DialogTitle>
            <DialogDescription className="sr-only">You received a nearby game invite. Accept to join the matchroom.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">You received an invite via {pendingInvite?.source === 'wifi' ? 'WiFi' : 'Bluetooth'}.</p>
            <p className="text-sm mt-2">Token: <span className="font-mono text-xs">{String(pendingInvite?.token || '')}</span></p>
          </div>
          <DialogFooter>
            <div className="flex gap-2 w-full">
              <UiButton variant="outline" onClick={handleDeclineInvite} className="w-full">Decline</UiButton>
              <UiButton onClick={handleAcceptInvite} className="w-full">Accept & Join</UiButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
