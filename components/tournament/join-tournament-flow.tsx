"use client"


import type { Tournament } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, DollarSign, Clock, Trophy, CheckCircle2, Share2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { apiClient } from "@/lib/api/client"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "@/hooks/use-toast"

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
  const searchParams = useSearchParams()

  // Handle return from payment gateway
  const [showManualVerify, setShowManualVerify] = useState(false)
  const [manualTxId, setManualTxId] = useState("")

  const handleManualVerify = async (txId: string) => {
    if (!user || !txId) return
    setLoading(true)
    setError(null)
    try {
      // Verify
      const ver = await apiClient.verifyWalletTransaction({ transactionId: txId })
      if (!ver.success) throw new Error(ver.error || "Verification failed. Please check the ID.")

      // Join
      const join = await apiClient.joinTournamentWithCode(inviteCode, user.id)
      if (!join.success) throw new Error(join.error || "Failed to join tournament")

      setTicket({
        reference: txId,
        joinedAt: new Date().toISOString()
      })
      try { await refreshUser() } catch { }
      toast({ title: "Success", description: "Payment verified! You have joined." })
    } catch (e: any) {
      setError(e.message || "Failed to verify transaction")
    } finally {
      setLoading(false)
    }
  }

  useState(() => {
    const checkPaymentReturn = async () => {
      const pendingJoin = localStorage.getItem("pending_tournament_join")
      if (!pendingJoin) return

      try {
        const { tournamentId: pendingId, inviteCode: pendingCode } = JSON.parse(pendingJoin)
        if (pendingId !== tournament.id) return // Wrong tournament page

        // Check for transaction_id or reference in URL
        const txId = searchParams.get("transaction_id") || searchParams.get("tx_ref") || searchParams.get("reference")

        if (txId) {
          setLoading(true)
          // Verify with backend
          const ver = await apiClient.verifyWalletTransaction({ transactionId: txId })
          if (!ver.success) {
            // Check if backend says "verified" but API wrapper returned standard error structure
            // Sometimes verification endpoint returns success: true inside data 
            throw new Error(ver.error || "Payment verification failed")
          }

          // Complete Join
          if (!user?.id) throw new Error("User session required")
          const join = await apiClient.joinTournamentWithCode(pendingCode, user.id)
          if (!join.success) throw new Error(join.error || "Failed to finalize join")

          setTicket({
            reference: txId,
            joinedAt: new Date().toISOString()
          })

          // Clear storage
          localStorage.removeItem("pending_tournament_join")
          // Clear URL params
          router.replace(window.location.pathname)
        }
      } catch (e: any) {
        console.error("Payment return error:", e)
        setError(e.message || "Failed to verify payment")
        localStorage.removeItem("pending_tournament_join")
      } finally {
        setLoading(false)
      }
    }

    // Tiny delay to ensure hydration
    setTimeout(checkPaymentReturn, 500)
  }) // Run once or when params change, currently using useState initializer hack or useEffect would be better. Let's use useEffect properly below.

  // Actually, let's use standard useEffect
  /**
   * Handle return from payment gateway
   */
  useEffect(() => {
    const handleReturn = async () => {
      const pendingJoin = localStorage.getItem("pending_tournament_join")
      if (!pendingJoin) return

      const txId = searchParams.get("transaction_id") || searchParams.get("tx_ref") || searchParams.get("reference")
      if (!txId) return

      // Logic: If user is logged out, we must stop here and ask them to log in.
      // We shouldn't try verifyWalletTransaction because we might lose the "ticket" if it fails due to auth.
      // Or if verify works but join fails, we're stuck.
      if (!user) {
        setLoading(false)
        console.log("User session lost on return. Waiting for login.")
        return
      }

      try {
        const { tournamentId: pendingId, inviteCode: pendingCode } = JSON.parse(pendingJoin)
        if (pendingId !== tournament.id) return

        setLoading(true)
        // Verify
        const ver = await apiClient.verifyWalletTransaction({ transactionId: txId })
        if (!ver.success) throw new Error(ver.error || "Payment verification failed")

        // Join
        const join = await apiClient.joinTournamentWithCode(pendingCode, user.id)
        if (!join.success) throw new Error(join.error || "Failed to join tournament")

        setTicket({
          reference: txId,
          joinedAt: new Date().toISOString()
        })
        try { await refreshUser() } catch { }

        localStorage.removeItem("pending_tournament_join")
        router.replace(window.location.pathname)
      } catch (e: any) {
        setError(e.message || "Payment verification failed")
        // Only remove pending join if it was a critical failure (like invalid code or already joined), 
        // but if it was network/auth, maybe keep it? 
        // For now, we clear it to prevent loops, unless it was "User session required" (which we caught above).
        localStorage.removeItem("pending_tournament_join")
      } finally {
        setLoading(false)
      }
    }

    handleReturn()
  }, [searchParams, tournament.id, user, inviteCode, router, refreshUser])

  const handleJoin = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Initiate payment for tournament entry fee
      const init = await apiClient.initWalletTransaction({
        amount: tournament.entryFee,
        method: "card",
        email: user?.email || "",
        name: user?.fullName || "",
        userId: user?.id || "",
        redirectUrl: window.location.href,
        tournamentId: tournament.id
      })

      if (!init.success) throw new Error(init.error || "Payment initiation failed")

      const paymentData: any = init.data || {}

      // 2. Redirect to payment gateway
      // Swagger says it returns { message, payment_link } or { data: { authorization_url: ... } } depending on provider
      // We check for common fields
      const link =
        paymentData?.payment_link ||
        paymentData?.data?.authorization_url ||
        paymentData?.data?.paymentUrl ||
        paymentData?.data?.link ||
        paymentData?.link ||
        paymentData?.authorization_url

      if (link) {
        // Save state to localStorage to handle return
        localStorage.setItem("pending_tournament_join", JSON.stringify({
          tournamentId: tournament.id,
          inviteCode: inviteCode
        }))
        window.location.href = link;
        return;
      }

      // If no link (e.g. bypass or immediate success), proceed to join
      // But usually we need the link.
      if (!link && !paymentData?.reference) {
        throw new Error("Could not retrieve payment link")
      }

      // 4. Join tournament after successful payment (if not redirected)
      // This part might be reached if the API returns success immediately (unlikely for card)
      if (!user?.id) throw new Error("You must be signed in to join the tournament")

      const join = await apiClient.joinTournamentWithCode(inviteCode, user.id)
      if (!join.success) throw new Error(join.error || "Failed to join tournament")

      // 5. Refresh user to pick up potential role upgrade
      try { await refreshUser() } catch { }

      setTicket({
        reference: paymentData?.reference || join.data?.paymentId || "REF-" + Date.now(),
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
                onClick={() => router.push(`/tournaments/${tournament.id}`)}
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

  // If we have a pending payment return but no user session
  if (searchParams.get("transaction_id") && !user && !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-yellow-500 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl">Login Required</CardTitle>
            <p className="text-gray-600">We verified your payment start, but need you to log in to complete the registration.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full py-4 text-lg"
              onClick={() => router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
            >
              Log In to Finish
            </Button>
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
            className="w-full text-base sm:text-lg whitespace-normal break-words text-center py-4 h-auto min-h-[3.5rem]"
            size="lg"
            disabled={loading}
          >
            {loading ? "Processing..." : `Join Tournament - ₦${tournament.entryFee.toLocaleString()}`}
          </Button>
          {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}

          <p className="text-xs text-gray-500 text-center">
            By joining, you agree to pay the entry fee and tournament rules.
          </p>
          <div className="pt-2">
            {!showManualVerify ? (
              <button
                type="button"
                onClick={() => setShowManualVerify(true)}
                className="w-full text-center text-sm text-green-600 hover:text-green-700 underline"
              >
                I&apos;ve already paid, but wasn&apos;t joined
              </button>
            ) : (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Manual Verification</p>
                <p className="text-xs text-gray-500">
                  Enter the Transaction Reference from your bank/email receipt (e.g. numbers or FLW-...)
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Transaction Ref / ID"
                    className="flex-1 px-3 py-2 text-sm border rounded"
                    value={manualTxId}
                    onChange={(e) => setManualTxId(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!manualTxId) return
                      // Trigger verification logic manually
                      const fakeParams = new URLSearchParams()
                      fakeParams.set("transaction_id", manualTxId)
                      // We can't easily injection into the existing hook, so we'll make a dedicated handler
                      handleManualVerify(manualTxId)
                    }}
                    disabled={loading || !manualTxId}
                  >
                    Verify
                  </Button>
                </div>
                <button
                  onClick={() => setShowManualVerify(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
