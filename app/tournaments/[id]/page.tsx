"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useTournamentStore } from "@/lib/stores/tournament-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { GlobalSidebar } from "@/components/ui/global-sidebar"
import { TopNavigation } from "@/components/ui/top-navigation"
import { GameButton } from "@/components/ui/game-button"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, HelpCircle, Calendar, Users, Play, CalendarClock, Swords, ArrowLeft, Copy } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { TournamentBracket } from "@/components/tournament/tournament-bracket"
import { TournamentFAQModal } from "@/components/tournament/tournament-faq-modal"
import { HostAdminModal } from "@/components/tournament/host-admin-modal"
import { TournamentWaitingRoom } from "@/components/tournament/tournament-waiting-room"
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

    const [showRescheduleModal, setShowRescheduleModal] = useState(false)
    const [newStartTime, setNewStartTime] = useState<string>("")
    const toLocalInputValue = (date: Date) => date.toISOString().slice(0, 16)

    const handleRescheduleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newStartTime) return
        try {
            const selected = new Date(newStartTime)
            if (selected < new Date()) {
                toast({ title: "Invalid Date", description: "Start time cannot be in the past.", variant: "destructive" })
                return
            }
            await apiClient.rescheduleTournament(tournamentId, selected.toISOString())
            toast({ title: "Rescheduled", description: "Tournament start time updated." })
            loadTournament(tournamentId)
            setShowRescheduleModal(false)
        } catch (error) {
            toast({ title: "Error", description: "Failed to reschedule", variant: "destructive" })
        }
    }

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
            const rawHost = currentTournament.hostId || (currentTournament as any).organizerId || (currentTournament as any).createdBy
            const hId = rawHost && typeof rawHost === 'object' ? rawHost._id || rawHost.id : rawHost
            const uId = user.id || (user as any)._id

            setIsHost(Boolean(hId && uId && String(hId) === String(uId)))
            setIsParticipant(currentTournament.participants?.some((p: any) => p.userId === uId || p.userId?._id === uId) || false)
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
            const res = await apiClient.startTournament(tournamentId, true) // Force start
            if (res.success) {
                toast({ title: "Tournament Started!", description: "Good luck to all players." })
                loadTournament(tournamentId)
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

    // Payment verification is now handled by /app/payment-return/page.tsx
    // We keep manual verification below as a fallback.

    // Manual Verification Logic
    const [showManualVerify, setShowManualVerify] = useState(false)
    const [manualTxId, setManualTxId] = useState("")
    const [verifyingManual, setVerifyingManual] = useState(false)

    const handleManualVerify = async () => {
        if (!user || !manualTxId.trim()) return
        setVerifyingManual(true)
        try {
            // 1. Verify Transaction
            const ver = await apiClient.verifyWalletTransaction({ transactionId: manualTxId.trim() })
            if (!ver.success) throw new Error(ver.error || "Verification failed")

            // 2. Join Tournament
            // We need the invite code. If it's not in the object (it should be normalized), we might fallback or error.
            // But usually normalized tournament has inviteCode.
            const code = currentTournament?.inviteCode
            if (!code) throw new Error("Could not retrieve invite code to join.")

            const join = await apiClient.joinTournamentWithCode(code, user.id)
            if (!join.success) throw new Error(join.error || "Failed to join tournament")

            toast({ title: "Success", description: "Payment verified! You have joined." })
            setShowManualVerify(false)
            setManualTxId("")
            loadTournament(tournamentId)
        } catch (e: any) {
            toast({ title: "Verification Failed", description: e.message, variant: "destructive" })
        } finally {
            setVerifyingManual(false)
        }
    }

    if (isLoading || !currentTournament) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                </div>
            </div>
        )
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-black relative overflow-hidden font-sans text-white">
                {/* Dashboard Background */}
                <Image
                    src="/images/dashboard-background.png"
                    alt="Dashboard Background"
                    fill
                    className="object-cover object-center z-0 opacity-40 fixed inset-0"
                    priority
                />
                <div className="relative z-10">
                    <GlobalSidebar showTrigger={false} />
                    <TopNavigation />

                    <div className="pt-24 sm:pt-28 px-4 sm:px-6 max-w-6xl mx-auto pb-24">
                        {/* Header Section */}
                        <div className="bg-gray-900/80 backdrop-blur-md border border-green-800/50 rounded-3xl p-6 sm:p-10 mb-8 relative overflow-hidden shadow-2xl">
                            {/* Background Accents */}
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <Trophy className="w-64 h-64 text-green-500" />
                            </div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-green-600/20 blur-3xl rounded-full pointer-events-none"></div>

                            {/* Header Controls */}
                            <div className="flex justify-between items-start absolute top-4 left-4 right-4 z-20">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white/50 hover:text-white hover:bg-white/10 gap-2"
                                    onClick={() => router.push(isHost ? '/host-dashboard' : '/dashboard')}
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-green-400 hover:text-green-300 hover:bg-green-900/50"
                                    onClick={() => setShowFAQ(true)}
                                >
                                    <HelpCircle className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="relative z-10 mt-14 sm:mt-10 max-w-3xl">
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-2 ${currentTournament.status === 'active'
                                        ? 'bg-green-500 text-black border-green-400 animate-pulse'
                                        : currentTournament.status === 'completed'
                                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                            : 'bg-white/10 text-gray-300 border-white/20'
                                        }`}>
                                        {currentTournament.status === 'active' && <span className="w-2 h-2 rounded-full bg-black animate-ping"></span>}
                                        {currentTournament.status}
                                    </span>
                                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                                        {currentTournament.gameMode} Mode
                                    </span>
                                    {currentTournament.type === "free" && (
                                        <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-bold border border-yellow-500/50 uppercase tracking-widest shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                                            Host Sponsored
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-3xl sm:text-5xl font-black text-white mb-2 tracking-tight uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 drop-shadow-sm">
                                    {currentTournament.name}
                                </h1>
                                <p className="text-gray-400 text-sm max-w-xl">
                                    {currentTournament.type === "free" ? (
                                        "A free, host-sponsored tournament! Play for absolute bragging rights."
                                    ) : (
                                        `Compete for the ₦${((currentTournament.totalPool) || (currentTournament.entryFee * currentTournament.maxPlayers) || 0).toLocaleString()} prize pool.`
                                    )}
                                    {currentTournament.status === 'waiting' && " Use the invite code below to bring more players."}
                                </p>

                                {currentTournament.inviteCode && (
                                    <div className="mt-4 flex items-center gap-2 bg-black/40 border border-white/10 w-max px-3 py-2 rounded-lg backdrop-blur-sm cursor-pointer hover:bg-white/5 transition-colors group" onClick={() => {
                                        navigator.clipboard.writeText(currentTournament.inviteCode)
                                        toast({ title: "Copied!", description: "Invite code copied to clipboard." })
                                    }}>
                                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Invite Code:</span>
                                        <span className="text-lg font-mono font-bold text-green-400 tracking-widest">{currentTournament.inviteCode}</span>
                                        <Copy className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors ml-2" />
                                    </div>
                                )}

                                {/* Post-Tournament Winners Podium (Hero) */}
                                {currentTournament.status === "completed" && currentTournament.winners?.length > 0 && (
                                    <div className="mt-8 p-4 bg-gradient-to-r from-yellow-900/20 to-black/50 border border-yellow-500/30 rounded-xl relative">
                                        <h3 className="text-yellow-500 font-bold uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                                            <Trophy className="w-4 h-4" /> Champions
                                        </h3>
                                        <div className="flex flex-wrap gap-4">
                                            {currentTournament.winners.slice(0, 3).map((w, i) => (
                                                <div key={w.userId} className="flex items-center gap-3 bg-black/40 px-3 py-2 rounded-lg border border-yellow-500/20">
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${w.rank === 1 ? 'bg-yellow-500 text-black' :
                                                        w.rank === 2 ? 'bg-gray-400 text-black' : 'bg-orange-700 text-white'
                                                        }`}>#{w.rank}</span>
                                                    <div>
                                                        <p className="font-bold text-sm text-yellow-100">Player {w.userId.slice(0, 4)}</p>
                                                        {currentTournament.type !== "free" && (
                                                            <p className="text-[10px] text-yellow-500">₦{w.prize?.toLocaleString() || 0}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
                                    <div className="bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-white/5 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Players</p>
                                            <p className="font-bold text-lg">{currentTournament.currentPlayers}/{currentTournament.maxPlayers}</p>
                                        </div>
                                    </div>
                                    {currentTournament.type !== "free" && (
                                        <div className="bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-white/5 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                                <Trophy className="w-5 h-5 text-yellow-500" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Pool</p>
                                                    {(!isHost && currentTournament.status !== 'completed') && (
                                                        <span className="text-[10px] text-green-500 bg-green-500/10 px-1 rounded">Est. Player Share</span>
                                                    )}
                                                </div>
                                                <p className="font-bold text-lg text-yellow-500">
                                                    ₦{(isHost || currentTournament.status === 'completed'
                                                        ? (currentTournament.totalPool || 0)
                                                        : (currentTournament.entryFee * currentTournament.maxPlayers * 0.4)
                                                    ).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-white/5 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Start</p>
                                            <p className="font-bold text-sm text-gray-300">
                                                {new Date(currentTournament.startTime || currentTournament.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-white/5 flex items-center justify-center">
                                        {/* Countdown or Status */}
                                        <div className="text-center">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">
                                                {currentTournament.status === 'created' ? 'Starts In' : 'Round'}
                                            </p>
                                            <p className="font-mono font-bold text-lg text-white">
                                                {currentTournament.status === 'created' ? (timeLeft || "Soon") : currentTournament.bracket?.currentRound || 1}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Manual Verification (For users who paid but aren't in) */}
                        {!isParticipant && !isHost && (currentTournament.status === 'created' || currentTournament.status === 'waiting') && (
                            <div className="mb-6 flex justify-center">
                                {!showManualVerify ? (
                                    <button
                                        onClick={() => setShowManualVerify(true)}
                                        className="text-xs text-green-500/70 hover:text-green-400 underline flex items-center gap-1"
                                    >
                                        <HelpCircle className="w-3 h-3" />
                                        Already paid? Verify transaction manually
                                    </button>
                                ) : (
                                    <div className="bg-black/60 backdrop-blur-md border border-gray-800 rounded-xl p-4 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-sm font-bold text-gray-200">Manual Payment Verification</p>
                                            <button onClick={() => setShowManualVerify(false)} className="text-gray-500 hover:text-white">&times;</button>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-3">Enter the Transaction ID (starts with 'tournament_') from your receipt.</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="e.g. tournament_123..."
                                                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-green-500 outline-none"
                                                value={manualTxId}
                                                onChange={(e) => setManualTxId(e.target.value)}
                                            />
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                                                onClick={handleManualVerify}
                                                disabled={verifyingManual || !manualTxId}
                                            >
                                                {verifyingManual ? "Checking..." : "Verify"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Host Controls (If Host) */}
                        {isHost && (
                            <div className="mb-6 p-1">
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {(currentTournament.status !== "active" && currentTournament.status !== "completed" && currentTournament.status !== "cancelled") && (
                                        <GameButton onClick={handleStartTournament} className="whitespace-nowrap px-4 py-2 text-sm shadow-lg shadow-green-900/20">
                                            <span className="flex items-center"><Play className="w-4 h-4 mr-2" /> Start Tournament</span>
                                        </GameButton>
                                    )}
                                    <GameButton onClick={() => setShowAdmin(true)} className="whitespace-nowrap px-4 py-2 text-sm bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700">
                                        <span className="flex items-center"><Users className="w-4 h-4 mr-2" /> Manage Players</span>
                                    </GameButton>
                                    <GameButton onClick={() => {
                                        setNewStartTime(toLocalInputValue(new Date(currentTournament.startTime || Date.now())))
                                        setShowRescheduleModal(true)
                                    }} className="whitespace-nowrap px-4 py-2 text-sm bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700">
                                        <span className="flex items-center"><CalendarClock className="w-4 h-4 mr-2" /> Reschedule</span>
                                    </GameButton>
                                </div>
                            </div>
                        )}

                        {/* Player Action (If Participant) */}
                        {isParticipant && activeMatch && (
                            <div className="mb-8 bg-gradient-to-r from-green-900/80 to-black border border-green-500/50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(34,197,94,0.15)] relative overflow-hidden group">
                                <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors"></div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30 animate-pulse">
                                        <Swords className="w-7 h-7 text-black" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Your Match is Live!</h3>
                                        <p className="text-green-300 font-medium">Round {activeMatch.roundNumber}</p>
                                    </div>
                                </div>
                                <GameButton onClick={handlePlayMatch} className="w-full md:w-auto min-w-[200px] relative z-10 shadow-xl shadow-green-900/50">
                                    Enter Match Room
                                </GameButton>
                            </div>
                        )}

                        {/* Main Content Tabs */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden min-h-[500px] backdrop-blur-sm">
                            <Tabs defaultValue="draw" className="w-full">
                                <div className="border-b border-gray-800 bg-black/20">
                                    <TabsList className="bg-transparent p-0 h-auto w-full justify-start rounded-none">
                                        <TabsTrigger value="draw" className="flex-1 py-4 text-sm font-bold uppercase tracking-widest rounded-none data-[state=active]:bg-green-900/10 data-[state=active]:text-green-400 data-[state=active]:border-b-2 data-[state=active]:border-green-500 transition-all text-gray-500">
                                            Draw
                                        </TabsTrigger>
                                        <TabsTrigger value="leaderboard" className="flex-1 py-4 text-sm font-bold uppercase tracking-widest rounded-none data-[state=active]:bg-green-900/10 data-[state=active]:text-green-400 data-[state=active]:border-b-2 data-[state=active]:border-green-500 transition-all text-gray-500">
                                            Leaderboard
                                        </TabsTrigger>
                                        <TabsTrigger value="rules" className="flex-1 py-4 text-sm font-bold uppercase tracking-widest rounded-none data-[state=active]:bg-green-900/10 data-[state=active]:text-green-400 data-[state=active]:border-b-2 data-[state=active]:border-green-500 transition-all text-gray-500">
                                            Rules
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="draw" className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold text-white">Tournament Draw</h2>
                                        <span className="text-xs font-mono text-gray-500 bg-gray-800 px-2 py-1 rounded">
                                            {currentTournament.bracket?.rounds?.reduce((acc, r) => acc + r.matches.length, 0) || 0} Matches Total
                                        </span>
                                    </div>
                                    {currentTournament.status === 'created' || currentTournament.status === 'waiting' ? (
                                        <TournamentWaitingRoom
                                            tournamentId={currentTournament.id}
                                            maxPlayers={currentTournament.maxPlayers || 16}
                                            inviteCode={currentTournament.inviteCode}
                                            isHost={isHost}
                                            startTime={currentTournament.startTime ? String(currentTournament.startTime) : undefined}
                                        />
                                    ) : currentTournament.bracket ? (
                                        <TournamentBracket bracket={currentTournament.bracket} currentUserId={user?.id} />
                                    ) : (
                                        <div className="text-center py-20 bg-black/20 rounded-xl border border-dashed border-gray-800">
                                            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                            <p className="text-gray-400 font-medium">Draw Pending</p>
                                            <p className="text-sm text-gray-600">The bracket will be generated when the tournament starts.</p>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="leaderboard" className="p-6">
                                    <div className="space-y-6">
                                        {(() => {
                                            const poolBase = (isHost || currentTournament.status === 'completed')
                                                ? (currentTournament.totalPool || 0)
                                                : (currentTournament.entryFee * currentTournament.maxPlayers * 0.4);

                                            // Percentages of the PLAYER SHARE (which is 40% of total)
                                            // Wait, the requirement says "cashpool for players... 40% is the cashpool for the players".
                                            // So the 1st/2nd/3rd splits should be based on THIS 40% amount?
                                            // Usually splits are e.g. 50/30/20 of the PRIZE POOL.
                                            // So if we display the Prize Pool as 40% of Total, then we apply splits to that.

                                            return (
                                                <>
                                                    <div>
                                                        <h2 className="text-xl font-bold text-white mb-1">Projected Payouts</h2>
                                                        <p className="text-sm text-gray-500">Prize distribution based on current pool.</p>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {/* 1st Place */}
                                                        <div className="flex items-center justify-between p-4 rounded-xl border border-yellow-500/30 bg-yellow-900/10 relative overflow-hidden">
                                                            <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none"></div>
                                                            <div className="flex items-center gap-4 relative z-10">
                                                                <div className="w-10 h-10 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold shadow-[0_0_15px_rgba(234,179,8,0.4)]">1</div>
                                                                <div>
                                                                    <p className="font-bold text-white text-lg">Champion</p>
                                                                    <p className="text-yellow-500 text-xs font-mono">
                                                                        {currentTournament.winners?.[0] ? `Winner: Player ${currentTournament.winners[0].userId.slice(0, 4)}` : "TBD"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {currentTournament.type !== "free" && (
                                                                <p className="text-2xl font-bold text-yellow-400 font-mono">
                                                                    ₦{Math.floor(poolBase * 0.50).toLocaleString()}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* 2nd Place */}
                                                        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-600/30 bg-gray-800/20">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-full bg-gray-400 text-black flex items-center justify-center font-bold">2</div>
                                                                <div>
                                                                    <p className="font-bold text-white">Runner Up</p>
                                                                    <p className="text-gray-500 text-xs font-mono">
                                                                        {currentTournament.winners?.[1] ? `Winner: Player ${currentTournament.winners[1].userId.slice(0, 4)}` : "TBD"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {currentTournament.type !== "free" && (
                                                                <p className="text-xl font-bold text-gray-300 font-mono">
                                                                    ₦{Math.floor(poolBase * 0.30).toLocaleString()}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* 3rd Place */}
                                                        <div className="flex items-center justify-between p-4 rounded-xl border border-orange-700/30 bg-orange-900/10">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-full bg-orange-700 text-white flex items-center justify-center font-bold">3</div>
                                                                <div>
                                                                    <p className="font-bold text-white">Third Place</p>
                                                                    <p className="text-orange-500 text-xs font-mono">
                                                                        {currentTournament.winners?.[2] ? `Winner: Player ${currentTournament.winners[2].userId.slice(0, 4)}` : "TBD"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {currentTournament.type !== "free" && (
                                                                <p className="text-lg font-bold text-orange-400 font-mono">
                                                                    ₦{Math.floor(poolBase * 0.20).toLocaleString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )
                                        })()}
                                        {currentTournament.type !== "free" && (
                                            <div className="text-center pt-8 border-t border-gray-800 mt-8">
                                                <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">Total Prize Pool</p>
                                                <p className="text-4xl font-black text-green-500 font-mono">
                                                    ₦{(isHost || currentTournament.status === 'completed'
                                                        ? (currentTournament.totalPool || 0)
                                                        : (currentTournament.entryFee * currentTournament.maxPlayers * 0.4)
                                                    ).toLocaleString()}
                                                </p>
                                                <p className="text-[10px] text-gray-500 mt-2">Payouts are processed automatically to your wallet after tournament completion.</p>
                                            </div>
                                        )}
                                    </div >
                                </TabsContent>

                                <TabsContent value="rules" className="p-0">
                                    <div className="p-6">
                                        <h3 className="text-lg font-bold text-white mb-4">Official Rules</h3>
                                        <div className="prose prose-invert max-w-none text-sm text-gray-400 space-y-4">
                                            <p>1. <strong className="text-white">Fair Play:</strong> Any use of bots or external assistance will result in immediate disqualification.</p>
                                            <p>2. <strong className="text-white">Format:</strong> Single Elimination. If you lose a match, you are out.</p>
                                            <p>3. <strong className="text-white">Time Limit:</strong> Each player has a set time per game. Running out of time results in a loss.</p>
                                            <p>4. <strong className="text-white">Disconnects:</strong> If you disconnect for more than 30 seconds, you may forfeit the match.</p>
                                            <p>5. <strong className="text-white">Payouts:</strong> Prizes are distributed to the top 3 players as shown in the Leaderboard tab.</p>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
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

            <Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
                <DialogContent className="sm:max-w-md bg-black/95 border-green-500/30 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-green-400">Reschedule Tournament</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Select a new start time for the tournament.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRescheduleSubmit} className="space-y-4 mt-4">
                        <div>
                            <Label htmlFor="startTime" className="text-gray-300">New Start Time (Local)</Label>
                            <Input
                                id="startTime"
                                type="datetime-local"
                                min={new Date().toISOString().slice(0, 16)}
                                value={newStartTime}
                                onChange={(e) => setNewStartTime(e.target.value)}
                                required
                                className="w-full bg-gray-900 border-gray-700 text-white focus:ring-green-500"
                            />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowRescheduleModal(false)} className="flex-1 bg-transparent border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800">
                                Cancel
                            </Button>
                            <GameButton type="submit" className="flex-1 py-1">
                                Save
                            </GameButton>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

        </ProtectedRoute>
    )
}
