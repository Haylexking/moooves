"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { JoinTournamentFlow } from "@/components/tournament/join-tournament-flow"
import type { Tournament } from "@/lib/types"

export default function JoinTournamentPage() {
  const params = useParams()
  const inviteCode = params.code as string
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTournamentByInvite() {
      try {
        // TODO: Replace with actual API call
        // const tournament = await api.getTournamentByInviteCode(inviteCode)
        setIsLoading(false)
      } catch (err) {
        setError("Invalid or expired invite code")
        setIsLoading(false)
      }
    }

    if (inviteCode) {
      loadTournamentByInvite()
    }
  }, [inviteCode])

  if (isLoading) {
    return <div>Loading tournament...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!tournament) {
    return <div>Tournament not found</div>
  }

  return <JoinTournamentFlow tournament={tournament} inviteCode={inviteCode} />
}
