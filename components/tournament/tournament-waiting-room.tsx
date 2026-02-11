"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api/client"
import { Users, Clock, Trophy, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface TournamentWaitingRoomProps {
    tournamentId: string
    maxPlayers: number
    inviteCode?: string
    isHost?: boolean
    startTime?: string
}

interface WaitingPlayer {
    _id: string
    userId: {
        _id: string
        username: string
        email?: string
        fullName?: string
    }
    status: string
    joinedAt: string
}

export function TournamentWaitingRoom({ tournamentId, maxPlayers, inviteCode, isHost, startTime }: TournamentWaitingRoomProps) {
    const [players, setPlayers] = useState<WaitingPlayer[]>([])
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)

    const fetchWaitingRoom = async () => {
        try {
            const res = await apiClient.getTournamentWaitingRoom(tournamentId)
            if (res.success && res.data) {
                // Normalize data: sometimes it's { count, players: [] } or just []
                const list = Array.isArray(res.data) ? res.data : (res.data.players || [])
                setPlayers(list)
            }
        } catch (error) {
            console.error("Failed to fetch waiting room", error)
        } finally {
            setLoading(false)
        }
    }

    // Poll every 5 seconds
    useEffect(() => {
        fetchWaitingRoom()
        const interval = setInterval(fetchWaitingRoom, 5000)
        return () => clearInterval(interval)
    }, [tournamentId])

    const copyInvite = () => {
        if (inviteCode) {
            navigator.clipboard.writeText(inviteCode)
            setCopied(true)
            toast({ title: "Copied!", description: "Invite code copied to clipboard." })
            setTimeout(() => setCopied(false), 2000)
        }
    }

    // Calculate fill percentage
    const fillPercentage = Math.min(100, (players.length / maxPlayers) * 100)

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Status Bar */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">

                    {/* Player Count & Progress */}
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-end mb-2">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Users className="w-5 h-5 text-green-500" />
                                Players Joined
                            </h3>
                            <span className="text-2xl font-mono font-bold text-white">
                                {players.length}<span className="text-gray-500 text-lg">/{maxPlayers}</span>
                            </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-3 bg-gray-800 rounded-full overflow-hidden relative">
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-600 to-emerald-400 transition-all duration-500 ease-out rounded-full"
                                style={{ width: `${fillPercentage}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                            </div>
                        </div>
                    </div>

                    {/* Invite Code Section */}
                    {inviteCode && (
                        <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
                            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Invite Code</span>
                            <div className="flex items-center gap-2">
                                <code className="bg-black/50 border border-green-900/50 px-4 py-2 rounded-lg text-green-400 font-mono text-xl tracking-wider select-all">
                                    {inviteCode}
                                </code>
                                <Button size="icon" variant="outline" className="border-gray-700 hover:bg-gray-800" onClick={copyInvite}>
                                    <Share2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Players Grid */}
            <div className="bg-gray-900/30 border border-gray-800/50 rounded-2xl p-6 min-h-[300px]">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-800/50 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : players.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-gray-400 font-medium">Waiting for players to join...</p>
                        <p className="text-sm text-gray-600 mt-2">Share the invite code to get started!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {players.map((p) => {
                            // Get display name
                            const name = p.userId.fullName || p.userId.username || "Player"
                            const initials = name.slice(0, 2).toUpperCase()
                            const isMe = false // logic to check if me can be added if we pass currentUserId

                            return (
                                <div key={p._id} className="group relative bg-black/40 border border-gray-800 hover:border-green-500/50 transition-all rounded-xl p-3 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center shrink-0 group-hover:from-green-900 group-hover:to-green-950 transition-colors">
                                        <span className="text-sm font-bold text-gray-300 group-hover:text-green-400">{initials}</span>
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium text-gray-200 truncate">{name}</p>
                                        <p className="text-[10px] text-gray-500 truncate">Joined</p>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Empty Slots Placeholders (Optional visual flair) */}
                        {[...Array(Math.max(0, 4 - players.length))].map((_, i) => (
                            <div key={`empty-${i}`} className="border border-dashed border-gray-800 rounded-xl p-3 flex items-center gap-3 opacity-50">
                                <div className="w-10 h-10 rounded-full bg-gray-900/50 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-gray-700" />
                                </div>
                                <span className="text-xs text-gray-700 font-medium">Open Slot</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Ready State (Host View) */}
            {isHost && players.length >= 2 && (
                <div className="flex justify-center animate-in slide-in-from-bottom-4">
                    {/* The Start button is already in the main page header, so we might just show a status here */}
                    <div className="bg-green-900/20 border border-green-500/30 px-6 py-2 rounded-full flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-green-400 text-sm font-bold">Ready to Start</span>
                    </div>
                </div>
            )}
        </div>
    )
}
