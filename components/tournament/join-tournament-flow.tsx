"use client"


import type { Tournament } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, DollarSign, Clock, Trophy, CheckCircle2, Share2 } from "lucide-react"
import { useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { apiClient } from "@/lib/api/client"
import { useRouter } from "next/navigation"

interface JoinTournamentFlowProps {
  tournament: Tournament;
  inviteCode: string;
}

export function JoinTournamentFlow({ tournament, inviteCode }: JoinTournamentFlowProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<{ reference?: string; joinedAt: string } | null>(null);
  const { user, refreshUser } = useAuthStore();
  const router = useRouter()

  const handleJoin = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Initiate payment for tournament entry fee
      // BYPASS: Payment skipped for testing
      /*
      const init = await apiClient.initWalletTransaction({ amount: tournament.entryFee, method: "card", redirectUrl: window.location.href, tournamentId: tournament.id })
      if (!init.success) throw new Error(init.error || "Payment initiation failed")
      const paymentData: any = init.data || {}

      // 2. (Optional) Redirect to payment gateway if required
      // If paymentData contains a paymentUrl, redirect user
      const link = paymentData?.payment_link || paymentData?.data?.paymentUrl
      if (link) {
        window.location.href = link;
        return;
      }

      // 3. Verify payment (if transactionId present)
      if (paymentData?.data?.transactionId) {
        const ver = await apiClient.verifyWalletTransaction({ transactionId: paymentData.data.transactionId })
        if (!ver.success) throw new Error(ver.error || "Payment verification failed")
      }
      */
      const paymentData = { reference: "TEST-REF-" + Date.now() }

      // 4. Join tournament after successful payment
      if (!user?.id) throw new Error("You must be signed in to join the tournament")
      const join = await apiClient.joinTournamentWithCode(inviteCode, user.id)
      if (!join.success) throw new Error(join.error || "Failed to join tournament")

      // 5. Refresh user to pick up potential role upgrade (auto host after 3 tournaments)
      try { await refreshUser() } catch { }

      setTicket({
        reference: paymentData?.data?.transactionId || paymentData?.reference || join.data?.paymentId,
        joinedAt: new Date().toISOString(),
      })
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatStartTime = () => {
    const target = tournament.startedAt || tournament.createdAt
    return new Date(target || Date.now()).toLocaleString()
  }

  const handleShareInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode)
    } catch { }
  }

  if (ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-2 border-green-600 shadow-2xl">
          <CardHeader className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-700" />
            </div>
            <CardTitle className="text-2xl text-green-900">You&apos;re in!</CardTitle>
            <p className="text-gray-600 text-sm">Your spot in {tournament.name} is confirmed.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-xs uppercase text-green-600">Tournament starts</p>
                <p className="font-semibold text-green-900">{formatStartTime()}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-xs uppercase text-green-600">Entry fee</p>
                <p className="font-semibold text-green-900">₦{tournament.entryFee.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-xs uppercase text-green-600">Invite code</p>
                <p className="font-semibold text-green-900 tracking-wider">{inviteCode}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-xs uppercase text-green-600">Reference</p>
                <p className="font-semibold text-green-900">{ticket.reference ?? "Not provided"}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full py-6 text-base font-semibold"
                onClick={() => router.push(`/tournament/${tournament.id}`)}
              >
                Enter Lobby
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={handleShareInvite}
              >
                <Share2 className="w-4 h-4" />
                Copy Invite Code
              </Button>
            </div>

            <div className="text-center text-xs text-gray-500">
              Joined at {new Date(ticket.joinedAt).toLocaleTimeString()} • You&apos;ll be notified when your match is ready.
            </div>
          </CardContent>
        </Card>
      </div>
    )
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


          <Button
            onClick={handleJoin}
            className="w-full text-base sm:text-lg whitespace-normal break-words text-center py-4"
            size="lg"
            disabled={loading}
          >
            {loading ? "Processing..." : `Join Tournament - ₦${tournament.entryFee.toLocaleString()}`}
          </Button>
          {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}

          <p className="text-xs text-gray-500 text-center">
            By joining, you agree to pay the entry fee and tournament rules.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
