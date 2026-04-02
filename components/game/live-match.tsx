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
    // Removed redundant mount log to clean up console
    const [loading, setLoading] = useState(false)

    // Create State
    const [matchCode, setMatchCode] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    // Join State
    const [joinCode, setJoinCode] = useState("")
    const [error, setError] = useState<string | null>(null)

    const [activeMatchId, setActiveMatchId] = useState<string | null>(null)
    const [isHost, setIsHost] = useState(false)

    // Polling for room status and match readiness
    useEffect(() => {
        if (!activeMatchId) return

        const interval = setInterval(async () => {
            try {
                // Poll room status for 1v1 matches (not tournaments)
                const res = await apiClient.getMatchRoom(activeMatchId)
                console.log("[LiveMatch] Polling result:", res)
                
                if (res.success && res.data) {
                    const roomData = res.data?.room || res.data
                    const status = roomData?.status
                    console.log("[LiveMatch] Room status:", status)
                    
                    // BOTH: When status changes from "waiting" to "paired", create 1v1 match
                    if (status === 'paired') {
                        console.log("[LiveMatch] Room paired! Creating 1v1 match...")
                        console.log("[LiveMatch] Available fields:", Object.keys(roomData))
                        
                        // First check if match already exists
                        const existingMatchId = roomData.matchId || roomData.match?._id || roomData.match?.id || roomData.activeMatchId
                        console.log("[LiveMatch] Found existing match ID:", existingMatchId)
                        
                        if (existingMatchId) {
                            console.log("[LiveMatch] Match already exists, navigating to:", existingMatchId)
                            clearInterval(interval)
                            router.push(`/game/${existingMatchId}`)
                        } else {
                            console.log("[LiveMatch] No existing match, creating new 1v1 match...")
                            console.log("[LiveMatch] Using room _id for match creation:", roomData._id)
                            
                            // Create 1v1 match using the room ID
                            const promoteRes = await apiClient.create1v1Match(roomData._id)
                            console.log("[LiveMatch] Match creation response:", promoteRes)
                            
                            if (promoteRes.success) {
                                const matchData = promoteRes.data?.match || promoteRes.data
                                const matchId = matchData?._id || matchData?.id || matchData?.matchId
                                console.log("[LiveMatch] Extracted matchId:", matchId)
                                
                                if (matchId) {
                                    console.log("[LiveMatch] Navigating to new match:", matchId)
                                    clearInterval(interval)
                                    router.push(`/game/${matchId}`)
                                } else {
                                    console.error("[LiveMatch] No matchId found in creation response")
                                }
                            } else {
                                console.error("[LiveMatch] Match creation failed:", promoteRes.error)
                            }
                        }
                    } else if (status === 'waiting') {
                        // Room is still waiting for players - continue polling
                        console.log("[LiveMatch] Room still waiting for players...")
                    } else {
                        console.log("[LiveMatch] Room status:", status, "- continuing to poll")
                    }
                } else if (res.status === 400 || res.status === 404) {
                    // Stop polling if room doesn't exist or bad request
                    console.error("[LiveMatch] Room not found or invalid request, stopping polling:", res.error)
                    clearInterval(interval)
                    setActiveMatchId(null)
                } else {
                    // Log unexpected responses for debugging
                    console.log("[LiveMatch] Unexpected polling response:", res)
                }
            } catch (err) {
                console.error("[LiveMatch] Polling error:", err)
                // Continue polling on error unless it's a 404
                if (String(err).includes('404') || String(err).includes('not found')) {
                    console.error("[LiveMatch] Room not found, stopping polling")
                    clearInterval(interval)
                    setActiveMatchId(null)
                }
            }
        }, 3000) // Poll every 3 seconds to reduce API spam

        return () => clearInterval(interval)
    }, [activeMatchId, router, isHost, matchCode])

    const handleCreate = async () => {
        if (!user) return
        setLoading(true)
        setError(null)
        try {
            // 1. Create the room for 1v1 matches
            const response = await apiClient.createMatchRoom(user.id, "TicTacToe")
            console.log("[LiveMatch] Create room response:", response)
            
            if (response.success) {
                // Backend now returns data directly, not nested in room object
                const roomData = response.data
                console.log("[LiveMatch] Room data extracted:", roomData)
                const { roomId, roomCode, inviteCode, matchCode, _id } = roomData
                const finalRoomId = roomId || _id
                const finalCode = inviteCode || matchCode || roomCode  // ✅ inviteCode comes first
                
                console.log("[LiveMatch] Extracted IDs - RoomId:", finalRoomId, "Code:", finalCode)
                
                if (!finalRoomId || !finalCode) {
                    console.error("[LiveMatch] Missing room ID or code from response")
                    setError("Failed to create room - missing data")
                    return
                }
                
                setMatchCode(finalCode)  // Use inviteCode from backend response
                setActiveMatchId(finalRoomId)
                setIsHost(true)
                
                // Backend automatically assigns host as player1, no need to call join endpoint
                console.log("[LiveMatch] Room created successfully, host automatically assigned as player1")
                console.log("[LiveMatch] Setting matchCode to:", finalCode)
                
                // Switch to create view to show the match code
                setView("create")
            } else {
                setError(response.error || "Failed to create room")
            }
        } catch (err: any) {
            setError(err.message || "Failed to create room")
        } finally {
            setLoading(false)
        }
    }

    const handleJoin = async () => {
        if (!user || !joinCode || joinCode.length < 3) {
            setError("Please enter a valid code")
            toast({ title: "Invalid Code", description: "Code must be at least 3 characters", variant: "destructive" })
            return
        }
        
        setLoading(true)
        setError(null)
        
        console.log("[LiveMatch] Attempting to join with code:", joinCode, "User ID:", user.id)
        
        try {
            // 1. First try to join by code
            const res = await apiClient.joinLive1v1MatchByCode(joinCode, user.id)
            console.log("[LiveMatch] Join response:", res)
            console.log("[LiveMatch] Full join response data:", JSON.stringify(res.data, null, 2))
            
            if (res.success && res.data) {
                const joinedRoomId = res.data.roomId || res.data.room?._id || res.data.room?.id || res.data.id
                const status = res.data.room?.status || res.data.status || ""
                console.log(`[LiveMatch] Join success! Room: ${joinedRoomId}, Status: ${status}`)
                console.log("[LiveMatch] Full join response data:", JSON.stringify(res.data, null, 2))
                
                if (status.toLowerCase() === 'playing') {
                    // Match has already been promoted by the Host!
                    const actualMatchId = res.data.matchId || res.data.room?.matchId || joinedRoomId
                    console.log("[LiveMatch] Match ready! Redirecting to game...")
                    router.push(`/game/${actualMatchId}`)
                } else {
                    // Lobby is just paired. Wait for Host to promote.
                    setMatchCode(joinCode)
                    setActiveMatchId(joinedRoomId)
                    setIsHost(false)
                    setView("create")
                }
            } else {
                const errorMsg = res.error || "Invalid code or match full"
                console.error("[LiveMatch] Join failed:", errorMsg)
                setError(errorMsg)
                toast({ title: "Join Failed", description: errorMsg, variant: "destructive" })
            }
        } catch (error) {
            console.error("[LiveMatch] Join exception:", error)
            const errorMsg = error instanceof Error ? error.message : "Network error occurred"
            setError(errorMsg)
            toast({ title: "Join Error", description: errorMsg, variant: "destructive" })
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
        console.log("[LiveMatch] Render create view - matchCode:", matchCode)
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
