"use client"

import type { Tournament } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Clock, DollarSign, Trophy } from "lucide-react"

interface TournamentViewProps {
  tournament: Tournament
}

export function TournamentView({ tournament }: TournamentViewProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{tournament.name}</h1>
        <p className="text-gray-600">Tournament Details</p>
      </div>

      {/* Tournament Info */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Players</p>
                <p className="text-2xl font-bold">
                  {tournament.currentPlayers}/{tournament.maxPlayers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Entry Fee</p>
                <p className="text-2xl font-bold">₦{tournament.entryFee.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Trophy className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Prize Pool</p>
                <p className="text-2xl font-bold">₦{tournament.totalPool.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Clock className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-bold capitalize">{tournament.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tournament Content */}
      <Card>
        <CardHeader>
          <CardTitle>Tournament Bracket</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Tournament bracket will appear here</p>
            <p className="text-sm text-gray-500">Waiting for tournament to start...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
