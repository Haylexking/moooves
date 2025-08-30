"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { useTournamentStore } from "@/lib/stores/tournament-store"
import { TournamentView } from "@/components/tournament/tournament-view"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function TournamentPage() {
  const params = useParams()
  const tournamentId = params.id as string
  const { currentTournament, loadTournament, isLoading } = useTournamentStore()

  useEffect(() => {
    if (tournamentId) {
      loadTournament(tournamentId)
    }
  }, [tournamentId, loadTournament])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!currentTournament) {
    return <div>Tournament not found</div>
  }

  return <TournamentView tournament={currentTournament} />
}
