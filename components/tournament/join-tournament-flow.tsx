"use client"

import type { Tournament } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, DollarSign, Clock, Trophy } from "lucide-react"

interface JoinTournamentFlowProps {
  tournament: Tournament
  inviteCode: string
}

export function JoinTournamentFlow({ tournament, inviteCode }: JoinTournamentFlowProps) {
  const handleJoin = () => {
    // TODO: Implement join tournament logic
    console.log("Joining tournament:", tournament.id, "with code:", inviteCode)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Join Tournament</CardTitle>
          <p className="text-gray-600">{tournament.name}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tournament Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm">Entry Fee</span>
              </div>
              <span className="font-semibold">₦{tournament.entryFee.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Players</span>
              </div>
              <span className="font-semibold">
                {tournament.currentPlayers}/{tournament.maxPlayers}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-600" />
                <span className="text-sm">Prize Pool</span>
              </div>
              <span className="font-semibold">₦{tournament.totalPool.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-sm">Match Duration</span>
              </div>
              <span className="font-semibold">10 minutes</span>
            </div>
          </div>

          {/* Prize Breakdown */}
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Prize Distribution</h3>
            <div className="space-y-1 text-sm text-yellow-700">
              <div className="flex justify-between">
                <span>1st Place:</span>
                <span>20% (₦{Math.floor(tournament.totalPool * 0.2).toLocaleString()})</span>
              </div>
              <div className="flex justify-between">
                <span>2nd Place:</span>
                <span>12% (₦{Math.floor(tournament.totalPool * 0.12).toLocaleString()})</span>
              </div>
              <div className="flex justify-between">
                <span>3rd Place:</span>
                <span>8% (₦{Math.floor(tournament.totalPool * 0.08).toLocaleString()})</span>
              </div>
            </div>
          </div>

          <Button onClick={handleJoin} className="w-full" size="lg">
            Join Tournament - ₦{tournament.entryFee.toLocaleString()}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            By joining, you agree to pay the entry fee and tournament rules.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
