"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useTournamentStore } from "@/lib/stores/tournament-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trophy, Users, DollarSign, Calendar } from "lucide-react"
import { CreateTournamentModal } from "@/components/tournament/create-tournament-modal"

export function HostDashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { user, rehydrated } = useAuthStore()
  const { userTournaments } = useTournamentStore()

  if (!rehydrated) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading session...</div>
  }

  const hostedTournaments = userTournaments.filter((t) => t.hostId === user?.id)
  const totalEarnings = 0 // TODO: Calculate from completed tournaments

  const hostName = user?.fullName || user?.email || "Host"

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-1">Welcome, {hostName}</h1>
          <p className="text-sm md:text-base text-gray-200">
            Manage your tournaments, view stats, and take quick actions
          </p>
        </div>
        <div className="flex-shrink-0">
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2">
            <Plus className="w-4 h-4" />
            Create Tournament
          </Button>
        </div>
      </div>

      {/* Host Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-sky-600" />
              <CardTitle className="text-sm font-medium text-slate-700">Tournaments Hosted</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <p className="text-2xl md:text-3xl font-semibold text-slate-900">{hostedTournaments.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-emerald-600" />
              <CardTitle className="text-sm font-medium text-slate-700">Total Players</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <p className="text-2xl md:text-3xl font-semibold text-slate-900">
              {hostedTournaments.reduce((sum, t) => sum + t.currentPlayers, 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-amber-600" />
              <CardTitle className="text-sm font-medium text-slate-700">Total Earnings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <p className="text-2xl md:text-3xl font-semibold text-slate-900">₦{totalEarnings.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-violet-600" />
              <CardTitle className="text-sm font-medium text-slate-700">Active Tournaments</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <p className="text-2xl md:text-3xl font-semibold text-slate-900">
              {hostedTournaments.filter((t) => t.status === "active").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main list */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Tournaments</CardTitle>
            </CardHeader>
            <CardContent>
              {hostedTournaments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No tournaments created yet</p>
                  <p className="text-sm text-gray-500 mb-4">Create your first tournament to start earning!</p>
                  <Button onClick={() => setShowCreateModal(true)}>Create Tournament</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {hostedTournaments.map((tournament) => (
                    <Card key={tournament.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900">{tournament.name}</h3>
                          <p className="text-sm text-slate-600 mt-1">
                            {tournament.currentPlayers}/{tournament.maxPlayers} players • ₦
                            {tournament.totalPool.toLocaleString()} pool
                          </p>
                          <p className="text-xs text-slate-500 mt-1">Invite Code: {tournament.inviteCode}</p>
                        </div>

                        <div className="flex-shrink-0 text-right flex flex-col items-end gap-2">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${
                              tournament.status === "active"
                                ? "bg-green-100 text-green-800"
                                : tournament.status === "waiting"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {tournament.status}
                          </span>
                          <Button size="sm" variant="outline">
                            Manage
                          </Button>
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
          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2">
                <Button variant="ghost" onClick={() => setShowCreateModal(true)} className="justify-start">
                  <Plus className="w-4 h-4 mr-2" /> Create tournament
                </Button>
                <Button variant="ghost" onClick={() => {}} className="justify-start">
                  <Users className="w-4 h-4 mr-2" /> View players
                </Button>
                <Button variant="ghost" onClick={() => {}} className="justify-start">
                  <Trophy className="w-4 h-4 mr-2" /> Manage active
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateTournamentModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  )
}
