"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api/client"
import type { Tournament } from "@/lib/types"
import { TournamentView } from "@/components/tournament/tournament-view"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface Props {
  tournamentId: string
}

export function TournamentPageClient({ tournamentId }: Props) {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await apiClient.getTournament(tournamentId)
        if (!active) return
        if (res.success) {
          const data: any = res.data?.tournament || res.data
          setTournament(data)
        } else {
          setTournament(null)
          setError(res.error || "Tournament not found")
        }
      } catch (err) {
        if (active) {
          setTournament(null)
          setError((err as Error)?.message || "Unable to load tournament.")
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [tournamentId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 max-w-md text-center">
          <p className="font-semibold mb-2">Tournament unavailable</p>
          <p className="text-sm">{error || "We couldn't load this tournament."}</p>
        </div>
      </div>
    )
  }

  return <TournamentView tournament={tournament} />
}
