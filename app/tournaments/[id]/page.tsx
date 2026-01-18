"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTournamentStore } from "@/lib/stores/tournament-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { GlobalSidebar } from "@/components/ui/global-sidebar"
import { TopNavigation } from "@/components/ui/top-navigation"
import { GameButton } from "@/components/ui/game-button"
import { Button } from "@/components/ui/button"
import { Trophy, HelpCircle, Calendar, Users, Play, CalendarClock, Swords, ArrowLeft } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { TournamentBracket } from "@/components/tournament/tournament-bracket"
import { TournamentFAQModal } from "@/components/tournament/tournament-faq-modal"
import { HostAdminModal } from "@/components/tournament/host-admin-modal"
import { toast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api/client"
import Image from "next/image"

export default function TournamentPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const { user } = useAuthStore()
    const { loadTournament, currentTournament, isLoading, getActiveMatch } = useTournamentStore()
    const [activeMatch, setActiveMatch] = useState<any>(null)
    const tournamentId = params.id

    const [timeLeft, setTimeLeft] = useState<string>("")
    const [showFAQ, setShowFAQ] = useState(false)
    const [showAdmin, setShowAdmin] = useState(false)
    const [isHost, setIsHost] = useState(false)
    const [isParticipant, setIsParticipant] = useState(false)

    // Initial load
    useEffect(() => {
        if (tournamentId) {
            loadTournament(tournamentId)
        }
    }, [tournamentId])

    // Dynamic polling
    useEffect(() => {
        if (!tournamentId) return

        const calculateInterval = () => {
            if (!currentTournament) return 10000

            const status = currentTournament.status
            const startTime = new Date(currentTournament.startTime || currentTournament.createdAt).getTime()
            const now = Date.now()
            const timeUntilStart = startTime - now

            // Active or starting soon (< 10 mins) -> 10s
            // Also keep fast polling if it started recently
            if (status === 'active' || (status === 'waiting' && timeUntilStart < 10 * 60 * 1000)) {
                return 10000
            }

            // Completed or far future -> 60s
            return 60000
        }

        const intervalMs = calculateInterval()
        const interval = setInterval(() => {
            loadTournament(tournamentId, true) // Silent refresh
        }, intervalMs)

        return () => clearInterval(interval)
    }, [tournamentId, currentTournament?.status, currentTournament?.startTime])

    useEffect(() => {
        if (currentTournament && user) {
            setIsHost(currentTournament.hostId === user.id || (currentTournament as any).organizerId === user.id)
            setIsParticipant(currentTournament.participants?.some((p: any) => p.userId === user.id) || false)
        }
    }, [currentTournament, user])

    useEffect(() => {
        if (!currentTournament?.startTime) return

        const timer = setInterval(() => {
            const start = new Date(currentTournament.startTime!).getTime()
            const now = new Date().getTime()
            const diff = start - now

            if (diff <= 0) {
                setTimeLeft("Started")
                clearInterval(timer)
            } else {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24))
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                const seconds = Math.floor((diff % (1000 * 60)) / 1000)

                let timeString = ""
                if (days > 0) timeString += `${days}d `
                if (hours > 0) timeString += `${hours}h `
                timeString += `${minutes}m ${seconds}s`
                setTimeLeft(timeString)
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [currentTournament?.startTime])

    const handleStartTournament = async () => {
        if (!currentTournament) return
        try {
            const res = await apiClient.startTournament(currentTournament.id, true) // Force start
            if (res.success) {
                toast({ title: "Tournament Started!", description: "Good luck to all players." })
                loadTournament(currentTournament.id)
            } else {
                toast({ title: "Failed to start", description: res.error, variant: "destructive" })
            }
        } catch (err) {
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
        }
    }

    useEffect(() => {
        if (currentTournament && user) {
            const match = getActiveMatch(user.id);
            setActiveMatch(match);
        }
    }, [currentTournament, user]);

    const handlePlayMatch = () => {
        if (activeMatch) {
            router.push(`/game/${activeMatch.id}`)
        }
    }

    if (isLoading || !currentTournament) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        )
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-black relative overflow-hidden">
                {/* Dashboard Background */}
                <Image
                    src="/images/dashboard-background.png"
                    alt="Dashboard Background"
                    fill
                    className="object-cover object-center z-0 opacity-50"
                    priority
                />
                <div className="relative z-10">
                    <GlobalSidebar showTrigger={false} />
                    <TopNavigation />

                    <div className="pt-24 sm:pt-28 px-6 sm:px-8 max-w-7xl mx-auto pb-12">
                        {/* Header Section */}
                        <div className="bg-gradient-to-br from-green-900/40 to-black border border-green-800/50 rounded-3xl p-6 sm:p-10 mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Trophy className="w-64 h-64 text-green-500" />
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 right-16 text-white/50 hover:text-white hover:bg-white/10 z-20"
                                onClick={() => router.push('/dashboard')}
                                title="Leave Lobby"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 right-4 text-green-400 hover:text-green-300 hover:bg-green-900/50 z-20"
                                onClick={() => setShowFAQ(true)}
                            >
                                <HelpCircle className="w-6 h-6" />
                            </Button>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-bold border border-green-500/30 uppercase tracking-wider">
                                        {currentTournament.status}
                                    </span>
                                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold border border-blue-500/30">
                                        {currentTournament.gameMode}
                                    </span>
                                </div>

                                <h1 className="text-3xl sm:text-5xl font-black text-white mb-6 tracking-tight">
                                    {currentTournament.name}
                                </h1>

                                {/* Completion View */}
                                {currentTournament.status === "completed" && (
                                    <div className="mb-8 p-6 bg-gradient-to-r from-yellow-900/40 to-black border border-yellow-600/50 rounded-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-20">
                                            <Trophy className="w-32 h-32 text-yellow-500" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                                            <Trophy className="w-6 h-6" /> Tournament Complete!
                                        </h2>
                                        <div className="space-y-4 relative z-10">
                                            {currentTournament.winners?.map((winner) => (
                                                <div key={winner.rank} className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-yellow-500/20">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                                                        ${winner.rank === 1 ? "bg-yellow-500 text-black" :
                                                                winner.rank === 2 ? "bg-gray-400 text-black" :
                                                                    "bg-orange-700 text-white"}`}>
                                                            #{winner.rank}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white">Player ID: {winner.userId.slice(0, 8)}</p>
                                                            <p className="text-xs text-gray-400">Rank {winner.rank}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-green-400 font-bold">₦{winner.prize.toLocaleString()}</p>
                                                        <p className="text-xs text-gray-500">{winner.paidOut ? "Paid" : "Processing"}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 text-gray-300 mb-8">
                                    <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                                        <Calendar className="w-6 h-6 text-green-500" />
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">Start Time</p>
                                            <p className="font-semibold">
                                                {new Date(currentTournament.startTime || currentTournament.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                                        <Users className="w-6 h-6 text-green-500" />
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">Players</p>
                                            <p className="font-semibold">
                                                {currentTournament.currentPlayers} / {currentTournament.maxPlayers}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                                        <Trophy className="w-6 h-6 text-green-500" />
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">Prize Pool</p>
                                            <p className="font-semibold text-green-400">₦{(currentTournament.totalPool || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Host Console - Only visible to Host */}
                                {isHost && (
                                    <div className="mb-8 bg-yellow-950/20 border border-yellow-600/30 rounded-2xl p-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <Users className="w-32 h-32 text-yellow-500" />
                                        </div>

                                        <h2 className="text-xl font-bold text-yellow-500 mb-6 flex items-center gap-2">
                                            <Users className="w-6 h-6" /> Host Management Console
                                        </h2>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                            {/* Actions */}
                                            <div>
                                                <h3 className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-4">Quick Actions</h3>
                                                <div className="flex flex-wrap gap-3">
                                                    {(currentTournament.status === "created" || currentTournament.status === "waiting") && (
                                                        <Button
                                                            onClick={handleStartTournament}
                                                            className="bg-yellow-600 hover:bg-yellow-700 text-white border-none"
                                                        >
                                                            <Play className="w-4 h-4 mr-2" /> Start Tournament
                                                        </Button>
                                                    )}

                                                    <Button
                                                        variant="outline"
                                                        className="border-yellow-600/50 text-yellow-500 hover:bg-yellow-900/20"
                                                        onClick={() => setShowAdmin(true)}
                                                    >
                                                        <Users className="w-4 h-4 mr-2" /> Admin Tools
                                                    </Button>

                                                    <Button
                                                        variant="outline"
                                                        className="border-yellow-600/50 text-yellow-500 hover:bg-yellow-900/20"
                                                        onClick={async () => {
                                                            const dateStr = prompt("Enter new start date (YYYY-MM-DD HH:mm):", new Date(currentTournament.startTime || Date.now()).toISOString().slice(0, 16).replace('T', ' '))
                                                            if (dateStr) {
                                                                try {
                                                                    const newDate = new Date(dateStr).toISOString()
                                                                    await apiClient.rescheduleTournament(tournamentId, newDate)
                                                                    loadTournament(tournamentId)
                                                                    toast({
                                                                        title: "Success",
                                                                        description: "Tournament rescheduled successfully",
                                                                        variant: "default",
                                                                    })
                                                                } catch (e) {
                                                                    toast({
                                                                        title: "Error",
                                                                        description: "Invalid date format or server error",
                                                                        variant: "destructive",
                                                                    })
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <CalendarClock className="w-4 h-4 mr-2" /> Reschedule
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Overview Stats */}
                                            <div>
                                                <h3 className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-4">Live Overview</h3>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-black/40 border border-yellow-900/30 p-3 rounded-lg">
                                                        <span className="text-xs text-gray-500 block mb-1">Status</span>
                                                        <span className="font-bold text-white capitalize">{currentTournament.status}</span>
                                                    </div>
                                                    <div className="bg-black/40 border border-yellow-900/30 p-3 rounded-lg">
                                                        <span className="text-xs text-gray-500 block mb-1">Registered</span>
                                                        <span className="font-bold text-white">{currentTournament.currentPlayers} / {currentTournament.maxPlayers}</span>
                                                    </div>
                                                    <div className="bg-black/40 border border-yellow-900/30 p-3 rounded-lg col-span-2">
                                                        <span className="text-xs text-gray-500 block mb-1">Current Round</span>
                                                        <span className="font-bold text-white">
                                                            Round {currentTournament.bracket?.currentRound || 1}
                                                            <span className="text-gray-500 font-normal ml-2">
                                                                ({currentTournament.bracket?.rounds?.find(r => r.roundNumber === currentTournament.bracket?.currentRound)?.matches.filter(m => m.status === 'active').length || 0} Active Matches)
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Countdown */}
                                {currentTournament.status === "created" && timeLeft && timeLeft !== "Started" && (
                                    <div className="mb-8 text-center">
                                        <p className="text-green-400 text-sm uppercase tracking-widest mb-2">Tournament Starts In</p>
                                        <div className="text-4xl sm:text-6xl font-mono font-bold text-white tracking-wider">
                                            {timeLeft}
                                        </div>
                                    </div>
                                )}

                                {/* Player Status - Only visible if Participant */}
                                {isParticipant && (
                                    activeMatch ? (
                                        <div className="bg-green-600/20 border border-green-500/50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                                                    <Swords className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-white">Your Match is Ready!</h3>
                                                    <p className="text-green-200">Round {activeMatch.roundNumber} • vs Opponent</p>
                                                </div>
                                            </div>
                                            <GameButton onClick={handlePlayMatch} className="w-full sm:w-auto min-w-[200px]">
                                                Play Match Now
                                            </GameButton>
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                                            <p className="text-gray-400">
                                                {currentTournament.status === "waiting"
                                                    ? "Waiting for tournament to start..."
                                                    : "You don't have an active match right now. Check back later or view the draw."}
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Bracket Section */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">Tournament Draw</h2>
                                <span className="text-sm text-gray-500">
                                    Round {currentTournament.bracket?.currentRound || 1} of {currentTournament.bracket?.rounds?.length || 1}
                                </span>
                            </div>

                            {currentTournament.bracket ? (
                                <TournamentBracket bracket={currentTournament.bracket} currentUserId={user?.id} />
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <p>Draw will be generated when the tournament starts.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <TournamentFAQModal open={showFAQ} onOpenChange={setShowFAQ} />
            {currentTournament && (
                <HostAdminModal
                    open={showAdmin}
                    onOpenChange={setShowAdmin}
                    tournamentId={currentTournament.id}
                    bracket={currentTournament.bracket}
                    onUpdate={() => loadTournament(currentTournament.id)}
                />
            )}
        </ProtectedRoute>
    )
}
