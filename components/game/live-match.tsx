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
    const [loading, setLoading] = useState(false)

    // Create State
    const [matchCode, setMatchCode] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [waiting, setWaiting] = useState(false)

    // Join State
    const [joinCode, setJoinCode] = useState("")
    const [error, setError] = useState<string | null>(null)

    // Polling for opponent when hosting
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (waiting && matchCode) {
            interval = setInterval(async () => {
                // Poll backend to check if someone joined
                // For now, we reuse getMatchRoom logic or expect a push update
                // Since we don't have the matchID readily exposed in this simple view, 
                // we'd typically return it from createLiveMatch.
            }, 3000)
        }
        return () => clearInterval(interval)
    }, [waiting, matchCode])

    const handleCreate = async () => {
        if (!user) return
        setLoading(true)
        setError(null)
        try {
            const res = await apiClient.createLiveMatch(user.id)
            if (res.success && res.data) {
                setMatchCode(res.data.roomCode)
                setWaiting(true)
                setView("create")

                // Start polling logic here or use a hook that takes the matchId
                const matchId = res.data.matchId
                if (matchId) {
                    pollForJoin(matchId)
                }
            } else {
                setError(res.error || "Failed to create match")
            }
        } catch (err) {
            setError("Connection failed")
        } finally {
            setLoading(false)
        }
    }

    const pollForJoin = (matchId: string) => {
        const interval = setInterval(async () => {
            try {
                const res = await apiClient.getMatchRoom(matchId)
                if (res.success && res.data) {
                    // If we have 2 participants or status is active
                    const parts = res.data.participants || []
                    if (parts.length > 1 || res.data.match?.status === 'active') {
                        clearInterval(interval)
                        router.push(`/game?live=true&id=${matchId}`)
                    }
                }
            } catch (e) { }
        }, 2000)

        // Cleanup interval on unmount handled by useEffect usually, 
        // but here we just let it run until redirect.
        // Ideally this should be in a useEffect dependent on matchId state.
    }

    // Effect to handle polling via state to be cleaner
    const [activeMatchId, setActiveMatchId] = useState<string | null>(null)
    useEffect(() => {
        if (!activeMatchId) return
        const interval = setInterval(async () => {
            try {
                const res = await apiClient.getMatchRoom(activeMatchId)
                if (res.success && res.data) {
                    const parts = res.data.participants || []
                    if (parts.length > 1 || res.data.match?.status === 'active') {
                        router.push(`/game?live=true&id=${activeMatchId}`)
                    }
                }
            } catch (e) { }
        }, 2000)
        return () => clearInterval(interval)
    }, [activeMatchId, router])


    // Updated create handler to use state
    const handleCreate2 = async () => {
        if (!user) return
        setLoading(true)
        try {
            const res = await apiClient.createLiveMatch(user.id)
            if (res.success && res.data) {
                setMatchCode(res.data.roomCode)
                setActiveMatchId(res.data.matchId)
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
                const matchId = res.data.matchId || res.data.id
                router.push(`/game?live=true&id=${matchId}`)
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
                <GameButton onClick={handleCreate2} disabled={loading} className="w-full py-6 text-lg">
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
