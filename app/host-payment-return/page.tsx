"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"

function HostPaymentReturnContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const [tournamentId, setTournamentId] = useState<string | null>(null)

  const verifyPayment = async () => {
    const txId = searchParams.get("transaction_id") || 
                 searchParams.get("tx_ref") || 
                 searchParams.get("reference")

    if (!txId) {
      setStatus("error")
      setError("No transaction reference found in URL.")
      return
    }

    setStatus("verifying")
    setError(null)

    try {
      // Verify the payment
      const verifyRes = await apiClient.verifyWalletTransaction({ transactionId: txId })
      
      if (!verifyRes.success) {
        throw new Error(verifyRes.error || "Payment verification failed.")
      }

      // Extract tournament ID from URL params or response
      const tournamentIdFromUrl = searchParams.get("tournamentId")
      if (tournamentIdFromUrl) {
        setTournamentId(tournamentIdFromUrl)
      }

      setStatus("success")
      toast({ 
        title: "Payment Successful", 
        description: "Host fee paid. Your tournament is now active!" 
      })

      // Redirect to tournament page after 2 seconds
      setTimeout(() => {
        if (tournamentIdFromUrl) {
          router.replace(`/tournaments/${tournamentIdFromUrl}`)
        } else {
          router.replace("/host-dashboard")
        }
      }, 2000)

    } catch (err: any) {
      setStatus("error")
      setError(err.message || "Payment verification failed.")
    }
  }

  // Auto-trigger verification on mount
  useState(() => {
    if (status === "idle") {
      verifyPayment()
    }
  })

  return (
    <div className="min-h-screen bg-black relative overflow-hidden font-sans text-white flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black pointer-events-none" />

      <div className="max-w-md w-full bg-gray-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-800 relative z-10 overflow-hidden">

        {/* VERIFYING */}
        {(status === "idle" || status === "verifying") && (
          <div className="p-12 text-center space-y-8">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-4 border-gray-800 rounded-full" />
              <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase">
                {status === "idle" ? "Initializing..." : "Verifying Payment..."}
              </h2>
              <p className="text-gray-400 mt-2 text-sm">
                Please don't close this page.
              </p>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {status === "success" && (
          <div className="p-12 text-center space-y-8">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>

            <div>
              <h2 className="text-3xl font-black uppercase italic">
                Payment Successful
              </h2>
              <p className="text-green-400 mt-2">Your tournament is now active! 🎉</p>
              <p className="text-gray-500 text-xs mt-1">
                Redirecting to tournament...
              </p>
            </div>
          </div>
        )}

        {/* ERROR */}
        {status === "error" && (
          <div className="p-8 space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-xl font-bold">Payment Verification Failed</h2>
              <p className="text-sm text-red-400 mt-2 bg-red-950/30 p-3 rounded">
                {error}
              </p>
            </div>

            <div className="space-y-3">
              <Button onClick={verifyPayment} className="w-full bg-white text-black">
                Try Again
              </Button>

              <Button
                variant="ghost"
                onClick={() => router.replace("/host-dashboard")}
                className="w-full text-gray-400"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="absolute bottom-6 text-[10px] text-gray-600 uppercase tracking-widest">
        Secured by Moooves
      </p>
    </div>
  )
}

export default function HostPaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        </div>
      }
    >
      <HostPaymentReturnContent />
    </Suspense>
  )
}
