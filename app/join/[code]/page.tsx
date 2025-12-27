"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { apiClient } from "@/lib/api/client"
import type { Tournament } from "@/lib/types"
import { GlobalSidebar } from "@/components/ui/global-sidebar"
import { TopNavigation } from "@/components/ui/top-navigation"
import { GameButton } from "@/components/ui/game-button"
import { Loader2, Trophy, Users, Calendar, CreditCard } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"

export default function JoinTournamentPage() {
  const params = useParams()
  const router = useRouter()
  const inviteCode = params.code as string
  const { user } = useAuthStore()

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!inviteCode) return

    const fetchTournament = async () => {
      try {
        const res = await apiClient.findTournamentByInviteCode(inviteCode)
        if (res.success && res.data) {
          setTournament(res.data)
        } else {
          setError(res.error || "Tournament not found")
        }
      } catch (err: any) {
        console.error("Join error:", err)
        setError("Failed to load tournament details: " + (err.message || String(err)))
      } finally {
        setLoading(false)
      }
    }

    fetchTournament()
  }, [inviteCode])

  const [showManualVerify, setShowManualVerify] = useState(false)
  const [manualTxId, setManualTxId] = useState("")
  const handleManualVerify = async (txId: string) => {
    if (!user || !txId) return
    setLoading(true)
    try {
      const ver = await apiClient.verifyWalletTransaction({ transactionId: txId })
      if (!ver.success) throw new Error(ver.error || "Verification failed")

      const join = await apiClient.joinTournamentWithCode(inviteCode, user.id)
      if (!join.success) throw new Error(join.error || "Failed to join tournament")

      toast({ title: "Success", description: "Payment verified! You have joined." })
      router.push(`/tournaments/${tournament?.id}`)
    } catch (e: any) {
      toast({ title: "Verification Failed", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!user || !tournament) return

    setJoining(true)
    try {
      // Check if tournament has entry fee
      if (tournament.entryFee > 0) {
        // Initiate payment flow
        // Initiate payment flow
        const res = await apiClient.initWalletTransaction({
          amount: tournament.entryFee,
          method: 'card',
          email: user.email,
          name: user.fullName,
          userId: user.id,
          redirectUrl: `${window.location.origin}/tournaments/${tournament.id}?join=${inviteCode}`,
          tournamentId: tournament.id
        })

        if (res.success && res.data?.payment_link) {
          // If it returns a link (e.g. for external gateway), redirect
          window.location.href = res.data.payment_link
        } else if (res.success) {
          // If immediate success (e.g. wallet balance), join directly
          await joinDirectly()
        } else {
          toast({
            title: "Payment Failed",
            description: res.error || "Could not initiate payment",
            variant: "destructive"
          })
          setJoining(false)
        }
      } else {
        // Free tournament, join directly
        await joinDirectly()
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
      setJoining(false)
    }
  }

  const joinDirectly = async () => {
    if (!user || !tournament) return

    const res = await apiClient.joinTournamentWithCode(inviteCode, user.id)
    if (res.success) {
      toast({
        title: "Joined!",
        description: "You have successfully joined the tournament.",
        variant: "default"
      })
      router.push(`/tournaments/${tournament.id}`)
    } else {
      toast({
        title: "Join Failed",
        description: res.error || "Could not join tournament",
        variant: "destructive"
      })
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-gray-300 mb-6">{error || "Tournament not found"}</p>
        <GameButton onClick={() => router.push('/dashboard')}>Back to Dashboard</GameButton>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <GlobalSidebar showTrigger={false} />
      <TopNavigation />

      {/* Background Image */}
      <div className="absolute inset-0 z-0 opacity-30">
        <Image
          src="/images/dashboard-background.png"
          alt="Background"
          fill
          className="object-cover"
        />
      </div>

      <main className="relative z-10 pt-24 px-4 flex flex-col items-center min-h-screen">
        <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-md border border-green-500/30 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-900/50 rounded-full flex items-center justify-center border-2 border-green-500">
              <Trophy className="w-10 h-10 text-green-400" />
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-center text-white mb-2">
            {tournament.name}
          </h1>
          <p className="text-center text-gray-400 mb-8">
            You've been invited to join this tournament!
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-gray-800">
              <div className="flex items-center gap-3 text-gray-300">
                <Users className="w-5 h-5 text-blue-400" />
                <span>Players</span>
              </div>
              <span className="font-mono font-bold text-white">
                {tournament.currentPlayers} / {tournament.maxPlayers}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-gray-800">
              <div className="flex items-center gap-3 text-gray-300">
                <CreditCard className="w-5 h-5 text-yellow-400" />
                <span>Entry Fee</span>
              </div>
              <span className="font-mono font-bold text-green-400">
                {tournament.entryFee > 0 ? `₦${tournament.entryFee.toLocaleString()}` : "Free"}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-gray-800">
              <div className="flex items-center gap-3 text-gray-300">
                <Calendar className="w-5 h-5 text-purple-400" />
                <span>Starts</span>
              </div>
              <span className="font-mono font-bold text-white text-sm">
                {tournament.startTime ? new Date(tournament.startTime).toLocaleString() : "Not scheduled"}
              </span>
            </div>
          </div>

          <GameButton
            onClick={handleJoin}
            disabled={joining}
            className="w-full py-4 text-lg"
            variant="default"
          >
            {joining ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Processing...
              </span>
            ) : (
              `Join Tournament ${tournament.entryFee > 0 ? `(Pay ₦${tournament.entryFee})` : ""}`
            )}
          </GameButton>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full mt-4 text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors"
          >
            Cancel
          </button>

          <div className="pt-4 border-t border-gray-800 mt-4">
            {!showManualVerify ? (
              <button
                type="button"
                onClick={() => setShowManualVerify(true)}
                className="w-full text-center text-xs text-green-500/80 hover:text-green-400 underline"
              >
                I&apos;ve already paid, but wasn&apos;t joined
              </button>
            ) : (
              <div className="bg-black/40 p-3 rounded-lg border border-gray-800 space-y-3">
                <p className="text-sm font-semibold text-gray-300">Manual Verification</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Transaction ID / Ref"
                    className="flex-1 px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded text-white"
                    value={manualTxId}
                    onChange={(e) => setManualTxId(e.target.value)}
                  />
                  <GameButton
                    onClick={() => handleManualVerify(manualTxId)}
                    disabled={loading || !manualTxId}
                    className="py-1 px-3 text-sm h-auto"
                  >
                    Verify
                  </GameButton>
                </div>
                <button
                  onClick={() => setShowManualVerify(false)}
                  className="text-xs text-gray-500 hover:text-gray-400 w-full text-center mt-1"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
