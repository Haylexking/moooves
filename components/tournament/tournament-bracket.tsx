"use client"

import { TournamentBracket as BracketType, BracketMatch } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Trophy, User } from "lucide-react"

interface TournamentBracketProps {
    bracket: BracketType
    currentUserId?: string
}

export function TournamentBracket({ bracket, currentUserId }: TournamentBracketProps) {
    if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p>Draw not generated yet.</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto pb-6">
            <div className="flex gap-8 min-w-max px-4">
                {bracket.rounds.map((round, roundIndex) => (
                    <div key={round.roundNumber} className="flex flex-col gap-4 min-w-[250px]">
                        <div className="text-center mb-4">
                            <h3 className="text-green-400 font-bold uppercase tracking-wider text-sm">
                                Round {round.roundNumber}
                            </h3>
                            <span className="text-xs text-gray-500">
                                {round.matches.length} Match{round.matches.length !== 1 ? "es" : ""}
                            </span>
                        </div>

                        <div className="flex flex-col justify-around flex-grow gap-8">
                            {round.matches.map((match, matchIndex) => (
                                <MatchCard
                                    key={match.id}
                                    match={match}
                                    isCurrentUser={match.player1Id === currentUserId || match.player2Id === currentUserId}
                                />
                            ))}
                        </div>
                    </div>
                ))}

                {/* Winner Column (Visual only, implied from last round) */}
                <div className="flex flex-col justify-center min-w-[200px]">
                    <div className="flex flex-col items-center justify-center h-full opacity-20">
                        <Trophy className="w-16 h-16 text-yellow-500 mb-2" />
                        <span className="text-yellow-500 font-bold">CHAMPION</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

function MatchCard({ match, isCurrentUser }: { match: BracketMatch; isCurrentUser: boolean }) {
    const getPlayerName = (id: string | null | undefined) => {
        // In a real app, we'd look up the user name from a map or the match object would have it populated
        if (!id) return "Waiting..."
        if (id === "bye") return "BYE"
        return id.slice(0, 8) // Truncate ID for display if no name
    }

    const p1Winner = match.winnerId === match.player1Id
    const p2Winner = match.winnerId === match.player2Id

    return (
        <div
            className={cn(
                "bg-gray-900/50 border rounded-lg overflow-hidden transition-all hover:bg-gray-900",
                isCurrentUser ? "border-green-500 ring-1 ring-green-500/50" : "border-gray-800",
                match.status === "active" && "ring-1 ring-yellow-500/50"
            )}
        >
            {/* Player 1 */}
            <div className={cn(
                "flex justify-between items-center px-3 py-2 border-b border-gray-800",
                p1Winner && "bg-green-900/20"
            )}>
                <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-gray-500" />
                    <span className={cn(
                        "text-sm font-medium",
                        p1Winner ? "text-green-400" : "text-gray-300"
                    )}>
                        {getPlayerName(match.player1Id)}
                    </span>
                </div>
                <span className="text-sm font-mono text-gray-500">{match.player1Score}</span>
            </div>

            {/* Player 2 */}
            <div className={cn(
                "flex justify-between items-center px-3 py-2",
                p2Winner && "bg-green-900/20"
            )}>
                <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-gray-500" />
                    <span className={cn(
                        "text-sm font-medium",
                        p2Winner ? "text-green-400" : "text-gray-300"
                    )}>
                        {getPlayerName(match.player2Id)}
                    </span>
                </div>
                <span className="text-sm font-mono text-gray-500">{match.player2Score}</span>
            </div>

            {match.status === "active" && (
                <div className="px-3 py-1 bg-yellow-500/10 text-center">
                    <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">Live</span>
                </div>
            )}
        </div>
    )
}
