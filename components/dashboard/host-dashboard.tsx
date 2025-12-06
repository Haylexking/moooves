"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useTournamentStore } from "@/lib/stores/tournament-store"
import type { Tournament } from '@/lib/types'
import { GameButton } from "@/components/ui/game-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trophy, Users, DollarSign, Calendar } from "lucide-react"
import { CreateTournamentModal } from "@/components/tournament/create-tournament-modal"
import { apiClient } from "@/lib/api/client"

export function HostDashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loadingTournamentId, setLoadingTournamentId] = useState<string | null>(null)
  const { user, rehydrated } = useAuthStore()
  const { userTournaments = [], loadUserTournaments } = useTournamentStore() as any

  // Load tournaments on mount to ensure the list is up to date
  useEffect(() => {
    if (user?.id && typeof loadUserTournaments === 'function') {
      loadUserTournaments(user.id).catch(() => void 0)
    }
  }, [user?.id, loadUserTournaments])

  if (!rehydrated) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading session...</div>
  }

  // Store already filters tournaments for us
  const hostedTournaments: Tournament[] = userTournaments as Tournament[]
  const totalEarnings = 0 // TODO: Calculate from completed tournaments

  const hostName = user?.fullName || user?.email || "Host"

  return (
    <div className="min-h-screen relative pt-24 sm:pt-28">
      {/* Use the global background (app/layout.tsx) so non-onboarding routes use dashboard-background.png */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-1 truncate max-w-[200px] sm:max-w-md md:max-w-xl">
              Welcome, {hostName}
            </h1>
            <p className="text-sm md:text-base text-green-100">
              Manage your tournaments, view stats, and take quick actions
            </p>
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto flex gap-2">
            <GameButton onClick={() => { /* Exit to home */ window.location.href = '/' }} className="w-full sm:w-auto bg-gray-200 text-gray-800">
              Exit
            </GameButton>
          </div>
        </div>

        {/* Host Stats - Compact Design */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="bg-green-100/95 border border-green-600 shadow-sm">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Hosted</p>
                <p className="text-lg font-bold text-green-900">{hostedTournaments.length}</p>
              </div>
              <Calendar className="w-5 h-5 text-green-600 opacity-70" />
            </CardContent>
          </Card>

          <Card className="bg-green-100/95 border border-green-600 shadow-sm">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Players</p>
                <p className="text-lg font-bold text-green-900">
                  {hostedTournaments.reduce((sum: number, t: Tournament) => sum + (t.currentPlayers || 0), 0)}
                </p>
              </div>
              <Users className="w-5 h-5 text-green-600 opacity-70" />
            </CardContent>
          </Card>

          <Card className="bg-green-100/95 border border-green-600 shadow-sm">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Earnings</p>
                <p className="text-lg font-bold text-green-900">
                  ₦{totalEarnings.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-5 h-5 text-green-600 opacity-70" />
            </CardContent>
          </Card>

          <Card className="bg-green-100/95 border border-green-600 shadow-sm">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Active</p>
                <p className="text-lg font-bold text-green-900">
                  {hostedTournaments.filter((t: Tournament) => t.status === "active").length}
                </p>
              </div>
              <Trophy className="w-5 h-5 text-green-600 opacity-70" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main list */}
          <div className="lg:col-span-2">
            <Card className="bg-green-100/95 border-2 border-green-600">
              <CardHeader>
                <CardTitle className="text-green-900">Your Tournaments</CardTitle>
              </CardHeader>
              <CardContent>
                {hostedTournaments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <p className="text-green-800 font-semibold">No tournaments created yet</p>
                    <p className="text-sm text-green-700 mb-4">Create your first tournament to start earning!</p>
                    <GameButton onClick={() => setShowCreateModal(true)} className="mx-auto max-w-xs">
                      Create Tournament
                    </GameButton>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hostedTournaments.map((tournament: Tournament) => (
                      <Card key={tournament.id} className="hover:shadow-md transition-shadow bg-white border-green-300">
                        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
                          <div className="flex-1 w-full sm:w-auto">
                            <h3 className="text-base sm:text-lg font-semibold text-green-900">{tournament.name}</h3>
                            <p className="text-xs sm:text-sm text-green-700 mt-1">
                              {tournament.currentPlayers || 0}/{tournament.maxPlayers || 0} players • ₦
                              {(tournament.totalPool || 0).toLocaleString()} pool
                            </p>
                            <p className="text-xs text-green-600 mt-1">Invite Code: {tournament.inviteCode}</p>
                          </div>

                          <div className="flex-shrink-0 text-right flex flex-col items-end gap-2 w-full sm:w-auto">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${tournament.status === "active"
                                ? "bg-green-200 text-green-900"
                                : tournament.status === "waiting"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                                }`}
                            >
                              {tournament.status}
                            </span>
                            <Link href={`/tournaments/${tournament.id}`} className="w-full sm:w-auto">
                              <GameButton variant="outline" size="sm" className="w-full sm:w-auto text-sm py-2">
                                View
                              </GameButton>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick actions / summary */}
          <div>
            <Card className="bg-green-100/95 border-2 border-green-600">
              <CardHeader>
                <CardTitle className="text-green-900">Quick actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col gap-2">
                  <GameButton onClick={() => setShowCreateModal(true)} className="justify-start text-sm py-3">
                    <Plus className="w-4 h-4" /> Create tournament
                  </GameButton>
                  <GameButton onClick={() => { }} className="justify-start text-sm py-3">
                    <Users className="w-4 h-4" /> View players
                  </GameButton>
                  <GameButton onClick={() => { }} className="justify-start text-sm py-3">
                    <Trophy className="w-4 h-4" /> Manage active
                  </GameButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <CreateTournamentModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  )
}
