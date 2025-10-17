"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog"
import { GameButton } from "./game-button"
import { useMatchRoom } from "@/lib/hooks/use-match-room"
import { useAuthStore } from "@/lib/stores/auth-store"
import { toast } from "@/hooks/use-toast"

export function StartGameModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter()
  const [flow, setFlow] = useState<"main" | "1v1-role" | "host-waiting" | "guest-connecting">("main")
  const [loading, setLoading] = useState(false)
  const [roomCode, setRoomCode] = useState("")
  const [connectionType, setConnectionType] = useState<"wifi" | "bluetooth" | null>(null)
  const matchRoom = useMatchRoom()
  const { user } = useAuthStore()

  const handleClose = (v: boolean) => {
    if (!v) {
      setFlow("main")
      setRoomCode("")
      setConnectionType(null)
    }
    onOpenChange(v)
  }

  const handleHostGame = async (type: "wifi" | "bluetooth") => {
    setLoading(true)
    setConnectionType(type)
    try {
      // Create room on backend and receive server tokens
      const created = await matchRoom.createRoom()
      // created may be null if backend didn't return structured data
      const backendCode = created?.roomCode || created?.roomId || created?.bluetoothToken || null
      setRoomCode(backendCode || "")
      toast({
        title: `Connected via ${type === "wifi" ? "Wi-Fi" : "Bluetooth"}`,
        description: backendCode ? `Room: ${backendCode}` : `Room created`,
        variant: "default",
      })
    // Start offline game mode when hosting a local connection
    // The caller should share `created.bluetoothToken` (if present) over the local channel
    // Keep serverAuthoritative=false (handled in MatchRoom/createRoom)
  setFlow("host-waiting")
    } catch (err) {
      toast({ title: "Connection failed", description: String(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGame = async () => {
    if (!roomCode) {
      toast({ title: "Missing code", description: "Enter a room code", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      await matchRoom.joinRoom(roomCode, "")
      toast({ title: "Joined", description: `Joined ${roomCode}`, variant: "default" })
      handleClose(false)
      router.push("/game?mode=p2p&role=guest")
    } catch (err) {
      toast({ title: "Join failed", description: String(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-green-50 to-green-100 border-4 border-green-600">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-green-900">Start Game</DialogTitle>
          <DialogDescription className="text-green-700">Select how you want to play</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {flow === "main" && (
            <div className="space-y-3">
              <GameButton onClick={() => setFlow("1v1-role")} className="w-full text-lg font-bold py-6">
                Play 1v1
              </GameButton>
              <GameButton
                onClick={() => {
                  handleClose(false)
                  router.push("/game?mode=ai")
                }}
                className="w-full text-lg font-bold py-6"
              >
                Player vs Computer
              </GameButton>
              <GameButton
                onClick={() => {
                  handleClose(false)
                  router.push("/tournaments")
                }}
                className="w-full text-lg font-bold py-6"
              >
                Join Tournament
              </GameButton>
            </div>
          )}

          {flow === "1v1-role" && (
            <div className="space-y-4">
              <p className="text-sm text-green-800 font-semibold text-center mb-2">Choose your role:</p>
              <div className="bg-green-200/50 rounded-xl p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-green-900 mb-2">Host Game</h3>
                  <p className="text-xs text-green-700 mb-3">Create a room and share the code with another player</p>
                  <div className="flex gap-2">
                    <GameButton
                      onClick={() => handleHostGame("wifi")}
                      disabled={loading}
                      className="flex-1 text-sm py-3"
                    >
                      {loading && connectionType === "wifi" ? "Connecting..." : "Wi-Fi"}
                    </GameButton>
                    <GameButton
                      onClick={() => handleHostGame("bluetooth")}
                      disabled={loading}
                      className="flex-1 text-sm py-3"
                    >
                      {loading && connectionType === "bluetooth" ? "Connecting..." : "Bluetooth"}
                    </GameButton>
                  </div>
                </div>
                <div className="border-t-2 border-green-300 pt-3">
                  <h3 className="font-bold text-green-900 mb-2">Join Game</h3>
                  <p className="text-xs text-green-700 mb-3">Enter the room code from the host</p>
                  <GameButton onClick={() => setFlow("guest-connecting")} className="w-full text-sm py-3">
                    Enter Room Code
                  </GameButton>
                </div>
              </div>
              <GameButton variant="pressed" onClick={() => setFlow("main")} className="w-full">
                Back
              </GameButton>
            </div>
          )}

          {flow === "host-waiting" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-green-800 font-semibold mb-2">Waiting for another player to connect...</p>
              </div>
              <div className="bg-green-200 rounded-xl p-4 text-center">
                <p className="text-xs text-green-700 mb-2 font-semibold">Share this code:</p>
                <div className="text-2xl font-black text-green-900 tracking-wider mb-2">{roomCode}</div>
                <p className="text-xs text-green-600">
                  Connected via {connectionType === "wifi" ? "Wi-Fi" : "Bluetooth"}
                </p>
              </div>
              <div className="flex gap-2">
                <GameButton
                  onClick={() => {
                    handleClose(false)
                    router.push("/game?mode=p2p&role=host")
                  }}
                  className="flex-1"
                >
                  Start Game
                </GameButton>
                <GameButton variant="pressed" onClick={() => setFlow("main")} className="flex-1">
                  Cancel
                </GameButton>
              </div>
            </div>
          )}

          {flow === "guest-connecting" && (
            <div className="space-y-4">
              <div className="bg-green-200/50 rounded-xl p-4">
                <label className="text-sm font-bold text-green-900 mb-2 block">Room Code</label>
                <input
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit code"
                  maxLength={12}
                  className="w-full px-4 py-3 rounded-lg border-2 border-green-400 bg-white text-green-900 font-bold text-center text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div className="flex gap-2">
                <GameButton onClick={handleJoinGame} disabled={loading || !roomCode} className="flex-1">
                  {loading ? "Joining..." : "Join Game"}
                </GameButton>
                <GameButton variant="pressed" onClick={() => setFlow("1v1-role")} className="flex-1">
                  Back
                </GameButton>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default StartGameModal
