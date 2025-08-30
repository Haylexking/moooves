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
import { Bluetooth, Wifi, Users, Smartphone, AlertCircle, CheckCircle, Copy } from "lucide-react"

export function OfflineGameSetup() {
  const [roomCode, setRoomCode] = useState("")
  const [copied, setCopied] = useState(false)

  const bluetooth = useBluetoothConnection()
  const wifi = useWiFiConnection()

  // Copy room code to clipboard
  const copyRoomCode = async () => {
    if (wifi.roomCode) {
      try {
        await navigator.clipboard.writeText(wifi.roomCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error("Failed to copy room code:", error)
      }
    }
  }

  // Check support on mount
  useEffect(() => {
    bluetooth.checkSupport()
  }, [bluetooth])

  const handleBluetoothScan = async () => {
    await bluetooth.scanForDevices()
  }

  const handleWiFiHost = async () => {
    try {
      await wifi.hostGame()
    } catch (error) {
      console.error("Failed to host game:", error)
    }
  }

  const handleWiFiJoin = async () => {
    if (!roomCode.trim()) return

    try {
      await wifi.joinGame(roomCode.trim().toUpperCase())
    } catch (error) {
      console.error("Failed to join game:", error)
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
                  <AlertDescription>{wifi.error}</AlertDescription>
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
                    <Label htmlFor="roomCode">Room Code</Label>
                    <Input
                      id="roomCode"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
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
                  <AlertDescription>{bluetooth.error}</AlertDescription>
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
              Connected via {wifi.isConnected ? "WiFi" : "Bluetooth"}. Ready to start playing.
            </p>
            <Button className="w-full" size="lg">
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
        </CardContent>
      </Card>
    </div>
  )
}
