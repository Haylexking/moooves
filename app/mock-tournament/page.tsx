"use client"

import { useState } from "react"
import { Users, Clock, Share2, Trophy, ArrowLeft, MoreVertical, CreditCard, DollarSign } from "lucide-react"
import { TournamentBracket } from "@/components/tournament/tournament-bracket"
import { GameButton } from "@/components/ui/game-button"
import type { Tournament, BracketMatch } from "@/lib/types"

// --- DUMMY DATA ---

const DUMMY_PLAYERS = [
    { id: "p1", username: "AlexKing", email: "alex@example.com" },
    { id: "p2", username: "ProGamer99", email: "pro@example.com" },
    { id: "p3", username: "ChessMaster", email: "chess@example.com" },
    { id: "p4", username: "NoobSlayer", email: "slayer@example.com" },
    { id: "p5", username: "ReactDev", email: "dev@example.com" },
    { id: "p6", username: "VimUser", email: "vim@example.com" },
    { id: "p7", username: "TypeScriptFan", email: "ts@example.com" },
    { id: "p8", username: "MooovesChamp", email: "champ@example.com" },
]

const DUMMY_MATCHES: BracketMatch[] = [
    // Round 1 (Quarter Finals) - All Completed
    { id: "m1", round: 1, player1Id: "p1", player2Id: "p2", winnerId: "p1", status: "completed", startTime: "2024-01-20T10:00:00Z" },
    { id: "m2", round: 1, player1Id: "p3", player2Id: "p4", winnerId: "p4", status: "completed", startTime: "2024-01-20T10:00:00Z" },
    { id: "m3", round: 1, player1Id: "p5", player2Id: "p6", winnerId: "p5", status: "completed", startTime: "2024-01-20T10:00:00Z" },
    { id: "m4", round: 1, player1Id: "p7", player2Id: "p8", winnerId: "p8", status: "completed", startTime: "2024-01-20T10:00:00Z" },
    // Round 2 (Semi Finals) - One Active, One Completed
    { id: "m5", round: 2, player1Id: "p1", player2Id: "p4", winnerId: null, status: "active", startTime: "2024-01-20T10:30:00Z" }, // AlexKing vs NoobSlayer (Live)
    { id: "m6", round: 2, player1Id: "p5", player2Id: "p8", winnerId: "p8", status: "completed", startTime: "2024-01-20T10:30:00Z" },
    // Round 3 (Finals) - Waiting
    { id: "m7", round: 3, player1Id: "p8", player2Id: null, winnerId: null, status: "waiting", startTime: "2024-01-20T11:00:00Z" },
]

const DUMMY_TOURNAMENT: Tournament = {
    id: "dummy-123",
    name: "Weekend Mega Championship",
    organizerId: "host-1",
    status: "active",
    currentRound: 2,
    totalRounds: 3,
    maxPlayers: 8,
    currentPlayers: 8,
    entryFee: 5000, // 5000 Naira
    currency: "NGN",
    startTime: "2024-01-20T10:00:00Z",
    createdAt: "2024-01-19T10:00:00Z",
    winners: [],
    bracket: {
        rounds: [
            { roundNumber: 1, matches: DUMMY_MATCHES.slice(0, 4) },
            { roundNumber: 2, matches: DUMMY_MATCHES.slice(4, 6) },
            { roundNumber: 3, matches: DUMMY_MATCHES.slice(6, 7) },
        ]
    }
}

const DUMMY_LEADERBOARD = [
    { rank: 1, name: "TBD", prize: 20000, userId: "tbd" },
    { rank: 2, name: "TBD", prize: 12000, userId: "tbd" },
    { rank: 3, name: "ReactDev", prize: 8000, userId: "p5" }, // 3rd place determined
]

export default function MockTournamentPage() {
    const [activeTab, setActiveTab] = useState<"leaderboard" | "matches" | "rules">("matches")
    const tournament = DUMMY_TOURNAMENT
    const totalPool = tournament.entryFee * tournament.maxPlayers

    return (
        <div className="min-h-screen bg-black text-white font-sans p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header Section (Replicating Detail View) */}
                <div className="bg-gray-900 border border-green-800 rounded-xl overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 right-0 p-4 opacity-50 pointer-events-none">
                        <Trophy className="w-32 h-32 text-green-900/20" />
                    </div>

                    <div className="p-6 md:p-8 relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-500 text-black animate-pulse">
                                        LIVE NOW
                                    </span>
                                    <span className="text-gray-400 text-sm flex items-center gap-1">
                                        <Clock className="w-4 h-4" /> Started 2 hours ago
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                                    {tournament.name}
                                </h1>
                            </div>
                        </div>

                        {/* Metrics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                            {/* Players Card */}
                            <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-green-900/50 flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Players</p>
                                    <p className="text-2xl font-bold text-white mt-1">{tournament.currentPlayers} <span className="text-gray-600 text-lg">/ {tournament.maxPlayers}</span></p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-green-900/20 flex items-center justify-center border border-green-500/30">
                                    <Users className="w-6 h-6 text-green-400" />
                                </div>
                            </div>

                            {/* Entry Fee Card */}
                            <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-green-900/50 flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Entry Fee</p>
                                    <p className="text-2xl font-bold text-white mt-1">₦{tournament.entryFee.toLocaleString()}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-yellow-900/20 flex items-center justify-center border border-yellow-500/30">
                                    <CreditCard className="w-6 h-6 text-yellow-500" />
                                </div>
                            </div>

                            {/* Total Pool Card */}
                            <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-green-900/50 flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Pool</p>
                                    <p className="text-2xl font-bold text-green-400 mt-1">₦{totalPool.toLocaleString()}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-emerald-900/20 flex items-center justify-center border border-emerald-500/30">
                                    <DollarSign className="w-6 h-6 text-emerald-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-t border-gray-800 bg-black/20 backdrop-blur-md">
                        {(["leaderboard", "matches", "rules"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? "text-green-400 bg-green-900/10" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                                    }`}
                            >
                                {tab === "matches" ? "Draw" : tab}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 min-h-[400px]">
                    {activeTab === "matches" && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-white">Tournament Draw</h3>
                                <span className="text-sm text-green-400 font-mono">Round {tournament.currentRound} / {tournament.totalRounds}</span>
                            </div>
                            {/* Render the actual Bracket Component */}
                            <TournamentBracket bracket={tournament.bracket!} currentUserId="host-view" />
                        </div>
                    )}

                    {activeTab === "leaderboard" && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white mb-4">Projected Payouts</h3>
                            <div className="space-y-2">
                                {DUMMY_LEADERBOARD.map((p) => (
                                    <div key={p.rank} className={`flex items-center justify-between p-4 rounded-lg border ${p.rank === 1 ? 'bg-yellow-900/10 border-yellow-600/50' : 'bg-black/40 border-gray-800'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${p.rank === 1 ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' :
                                                    p.rank === 2 ? 'bg-gray-400 text-black' :
                                                        p.rank === 3 ? 'bg-orange-700 text-white' : 'bg-gray-800 text-gray-400'
                                                }`}>
                                                {p.rank}
                                            </div>
                                            <div>
                                                <p className={`font-bold ${p.rank === 1 ? 'text-yellow-400' : 'text-white'}`}>{p.name}</p>
                                                <p className="text-xs text-gray-500">{p.rank === 1 ? 'Winner' : p.rank === 2 ? 'Runner-up' : 'Third Place'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono font-bold text-green-400">₦{p.prize.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
