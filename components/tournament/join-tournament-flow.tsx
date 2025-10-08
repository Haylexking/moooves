"use client"


import type { Tournament } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, DollarSign, Clock, Trophy } from "lucide-react"
import { useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"

interface JoinTournamentFlowProps {
  tournament: Tournament;
  inviteCode: string;
}

export function JoinTournamentFlow({ tournament, inviteCode }: JoinTournamentFlowProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const handleJoin = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Initiate payment for tournament entry fee
      const paymentRes = await fetch(`/api/v1/initial`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          tournamentId: tournament.id,
          amount: tournament.entryFee,
          method: "card", // or "bank_transfer" if supported
          redirectUrl: window.location.href,
        }),
      });
      const paymentData = await paymentRes.json();
      if (!paymentRes.ok || !paymentData.success) {
        throw new Error(paymentData.error || "Payment initiation failed");
      }

      // 2. (Optional) Redirect to payment gateway if required
      // If paymentData contains a paymentUrl, redirect user
      if (paymentData.data?.paymentUrl) {
        window.location.href = paymentData.data.paymentUrl;
        return;
      }

      // 3. Verify payment (simulate immediate success for demo)
      // In production, use webhook/callback for verification
      const verifyRes = await fetch(`/api/v1/verify?transaction_id=${paymentData.data?.transactionId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || "Payment verification failed");
      }

      // 4. Join tournament after successful payment
      const joinRes = await fetch(`/api/v1/tournaments/join/${inviteCode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ paymentMethod: "card" }),
      });
      const joinData = await joinRes.json();
      if (!joinRes.ok || !joinData.success) {
        throw new Error(joinData.error || "Failed to join tournament");
      }

      alert("Successfully joined tournament!");
      // Optionally, redirect or update UI
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

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


          <Button onClick={handleJoin} className="w-full" size="lg" disabled={loading}>
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
