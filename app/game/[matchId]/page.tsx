"use client"

import { useParams } from "next/navigation"
import { BattleGround } from "@/components/game/battle-ground"
import { GlobalSidebar } from "@/components/ui/global-sidebar"
import { TopNavigation } from "@/components/ui/top-navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function MatchGamePage() {
    const params = useParams()
    const matchId = params.matchId as string

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-black">
                <GlobalSidebar showTrigger={false} />
                <TopNavigation />

                <main className="pt-20 sm:pt-24 min-h-screen">
                    <BattleGround
                        gameMode="player-vs-player" // Tournament matches are always PvP
                        localMode="tournament"
                        matchId={matchId}
                    />
                </main>
            </div>
        </ProtectedRoute>
    )
}
