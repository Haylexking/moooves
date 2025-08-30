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
  const { user } = useAuthStore()
  const { userTournaments } = useTournamentStore()

  const hostedTournaments = userTournaments.filter((t) => t.hostId === user?.id)
  const totalEarnings = 0 // TODO: Calculate from completed tournaments

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Host Dashboard</h1>
          <p className="text-gray-600">Manage your tournaments and earnings</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Tournament
        </Button>
      </div>

      {/* Host Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Tournaments Hosted</p>
                <p className="text-2xl font-bold">{hostedTournaments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Players</p>
                <p className="text-2xl font-bold">{hostedTournaments.reduce((sum, t) => sum + t.currentPlayers, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <DollarSign className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold">₦{totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Trophy className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Active Tournaments</p>
                <p className="text-2xl font-bold">{hostedTournaments.filter((t) => t.status === "active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tournaments List */}
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
                <div key={tournament.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{tournament.name}</h3>
                    <p className="text-sm text-gray-600">
                      {tournament.currentPlayers}/{tournament.maxPlayers} players • ₦
                      {tournament.totalPool.toLocaleString()} pool
                    </p>
                    <p className="text-xs text-gray-500">Invite Code: {tournament.inviteCode}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 rounded text-xs mb-2 block ${
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTournamentModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  )
}
