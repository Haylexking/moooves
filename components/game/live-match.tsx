"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { apiClient } from "@/lib/api/client"
import { GameButton } from "@/components/ui/game-button"
import { Input } from "@/components/ui/input"
import { Loader2, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"

export function LiveMatch() {
    const router = useRouter()
    const { user } = useAuthStore()
    const { toast } = useToast()

    const [view, setView] = useState<"menu" | "create" | "join">("menu")
    console.log("[LiveMatch] Mounted. User ID:", user?.id, "Role:", user?.role)
    const [loading, setLoading] = useState(false)

    // Create State
    const [matchCode, setMatchCode] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    // Join State
    const [joinCode, setJoinCode] = useState("")
    const [error, setError] = useState<string | null>(null)

    const [activeMatchId, setActiveMatchId] = useState<string | null>(null)

    // Polling for opponent when hosting
    useEffect(() => {
        if (!activeMatchId) return

        const interval = setInterval(async () => {
            try {
                // If we are the host, we need to POLL to see if we can "create" the match (start it).
                // The backend requires "Both players must join first" before /matches POST works.
                // So we repeatedly try to create it.
                // If it returns 201, we are good.
                // If it returns 400 (waiting), we ignore.
                // If invalid role/error, we log.

                // Poll to create the match. This will fail (waiting) until opponent joins.
                const res = await apiClient.create1v1Match(activeMatchId)
                if (res.success) {
                    clearInterval(interval)
                    // The create response structure is { message, match: { _id, ... } }
                    // We must access res.data.match._id to get the actual match ID.
                    const finalMatchId = res.data?.match?._id || res.data?.match?.id || res.data?.matchId || res.data?._id || activeMatchId
                    console.log("[LiveMatch] Match started! Redirecting to:", finalMatchId)
                    router.push(`/game?live=true&id=${finalMatchId}&code=${matchCode || ''}`)
                } else {
                    console.log("[LiveMatch] Polling status:", res.error)
                    // If the error is NOT "waiting for players", we should verify it breaks or continues
                    if (res.error && !res.error.toLowerCase().includes("players")) {
                        // It might be "Room not found" or something fatal
                        console.error("Unexpected polling error:", res.error)
                    }
                }
            } catch (e) {
                console.error("Polling exception:", e)
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [activeMatchId, router])

    const handleCreate = async () => {
        if (!user) return
        setLoading(true)
        setError(null)
        try {
            // 1. Create the room
            const res = await apiClient.createLiveMatch(user.id)
            if (res.success && res.data) {
                console.log("[LiveMatch] Create Response:", JSON.stringify(res.data, null, 2))

                const code = res.data.matchCode || res.data.roomCode
                const newMatchId = res.data.roomId || res.data.matchId || res.data.id

                // 2. IMPORTANT: Host must explicitly JOIN the room to be "player1"
                // The backend does not auto-join the creator as a player.
                console.log("[LiveMatch] Auto-joining room as host...")
                const joinRes = await apiClient.joinMatchByCode(code, user.id)
                console.log("[LiveMatch] Auto-join result:", joinRes)

                setMatchCode(code)
                setActiveMatchId(newMatchId)

                // Do NOT redirect yet. Wait for polling (create1v1Match) to succeed.
                // This ensures the match exists in the /matches endpoint before we send the user there.
                // Now that we (host) have joined, the NEXT player to join will trigger "ready" state.
                setView("create")
            } else {
                toast({ title: "Error", description: res.error, variant: "destructive" })
            }
        } catch (e) {
            toast({ title: "Error", description: "Failed to connect", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const handleJoin = async () => {
        if (!user || !joinCode) return
        setLoading(true)
        try {
            const res = await apiClient.joinMatchByCode(joinCode.toUpperCase(), user.id)
            if (res.success && res.data) {
                // Redirect to game
                // Swagger: { room: { _id, ... } } or similar
                // Critical: Must prioritize ROOM ID over Match ID to match Host
                console.log("[LiveMatch] Join Success:", JSON.stringify(res.data, null, 2))

                // UNIFIED FLOW:
                // Both Host and Joiner must wait for the "Match" resource to be created.
                // The Joiner receives the ROOM ID here.
                // Instead of redirecting immediately (which fails if Match doesn't exist yet),
                // we set the Joiner to the same "Polling" state as the Host.
                // They will poll create1v1Match(roomId) until the backend says "OK".

                const roomId = res.data.roomId ||
                    res.data.room?._id ||
                    res.data.room?.id ||
                    res.data.id

                if (roomId) {
                    console.log("[LiveMatch] Joined Room, switching to polling mode for Match ID...")
                    setMatchCode(joinCode) // Show the code they joined with
                    setActiveMatchId(roomId)
                    setView("create") // Show the "Waiting..." screen which triggers polling
                } else {
                    setError("Invalid server response - No Room ID")
                }
            } else {
                setError(res.error || "Invalid code or match full")
            }
        } catch (e) {
            setError("Failed to join")
        } finally {
            setLoading(false)
        }
    }

    const copyCode = () => {
        if (matchCode) {
            navigator.clipboard.writeText(matchCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            toast({ description: "Code copied to clipboard" })
        }
    }

    if (view === "menu") {
        return (
            <div className="flex flex-col gap-4 w-full max-w-sm">
                <GameButton onClick={handleCreate} disabled={loading} className="w-full py-6 text-lg">
                    {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                    Create Match
                </GameButton>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-transparent px-2 text-white/50 font-bold">Or</span>
                    </div>
                </div>

                <GameButton variant="pressed" onClick={() => setView("join")} className="w-full py-6 text-lg bg-green-900/50 border-green-700/50 hover:bg-green-900/70">
                    Join Match
                </GameButton>
            </div>
        )
    }

    if (view === "create") {
        return (
            <Card className="w-full max-w-md bg-black/40 border-green-500/30 p-6 flex flex-col items-center gap-6 backdrop-blur-md">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">Share Code</h2>
                    <p className="text-green-200/70 text-sm">Share this code with your friend to start</p>
                </div>

                <div className="w-full relative">
                    <div className="bg-green-900/30 border-2 border-green-500/50 rounded-xl p-4 text-center relative group">
                        <span className="text-4xl font-mono font-black text-green-400 tracking-widest">
                            {matchCode || "..."}
                        </span>
                        <button
                            onClick={copyCode}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-white/70" />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-green-200/50 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Waiting for opponent...</span>
                </div>

                <button
                    onClick={() => setView("menu")}
                    className="text-white/50 hover:text-white text-sm underline underline-offset-4"
                >
                    Cancel
                </button>
            </Card>
        )
    }

    if (view === "join") {
        return (
            <Card className="w-full max-w-md bg-black/40 border-green-500/30 p-6 flex flex-col items-center gap-6 backdrop-blur-md">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">Join Match</h2>
                    <p className="text-green-200/70 text-sm">Enter the code from your friend</p>
                </div>

                <div className="w-full space-y-4">
                    <Input
                        placeholder="Enter Code (e.g. X7K9P2)"
                        value={joinCode}
                        onChange={(e) => {
                            setJoinCode(e.target.value.toUpperCase())
                            setError(null)
                        }}
                        className="text-center text-2xl font-mono tracking-widest uppercase bg-green-900/20 border-green-500/30 h-14 text-white placeholder:text-white/20 focus-visible:ring-green-500"
                        maxLength={6}
                    />

                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <GameButton
                        onClick={handleJoin}
                        disabled={loading || joinCode.length < 3}
                        className="w-full py-6 text-lg shadow-lg shadow-green-900/20"
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : "Join Game"}
                    </GameButton>
                </div>

                <button
                    onClick={() => setView("menu")}
                    className="text-white/50 hover:text-white text-sm underline underline-offset-4"
                >
                    Back
                </button>
            </Card>
        )
    }

    return null
}
