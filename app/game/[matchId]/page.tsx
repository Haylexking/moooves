"use client"

import { useParams, useSearchParams } from "next/navigation"
import { BattleGround } from "@/components/game/battle-ground"
import { GlobalSidebar } from "@/components/ui/global-sidebar"
import { TopNavigation } from "@/components/ui/top-navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function MatchGamePage() {
    const params = useParams()
    const matchId = params.matchId as string

    // TicTacToe is used for 1v1 match, unless explicitly in AI mode via params
    const searchParams = useSearchParams()
    const mode = searchParams.get("mode")
    
    const isAiMode = mode === "ai"
    const gameMode = isAiMode ? "player-vs-computer" : "player-vs-player"
    const localMode = isAiMode ? "ai" : "p2p"

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-black">
                <GlobalSidebar showTrigger={false} />
                <TopNavigation />

                <main className="pt-20 sm:pt-24 min-h-screen">
                    <BattleGround
                        gameMode={gameMode}
                        localMode={localMode}
                        matchId={matchId}
                    />
                </main>
            </div>
        </ProtectedRoute>
    )
}
