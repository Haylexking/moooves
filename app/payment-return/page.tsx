"use client"

import { usePaymentReturn } from "@/lib/hooks/use-payment-return"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter } from "next/navigation"
import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

function PaymentReturnContent() {
  const { status, flow, error, data, retry } = usePaymentReturn()
  const { user } = useAuthStore()
  const router = useRouter()
  const [manualId, setManualId] = useState("")

  // Context-aware labels
  const isHost = flow === "host"
  const statusLabel =
    status === "idle" ? "Initializing..." :
    status === "verifying" ? "Verifying Payment..." :
    status === "joining" ? "Joining Tournament..." :
    status === "activating" ? "Activating Tournament..." :
    ""

  const successMessage = isHost
    ? "Your tournament is now active! 🎉"
    : "You're in 🎉"

  const redirectLabel = isHost
    ? "Redirecting to tournament..."
    : "Redirecting to lobby..."

  const dashboardPath = isHost ? "/host-dashboard" : "/dashboard"

  return (
    <div className="min-h-screen bg-black relative overflow-hidden font-sans text-white flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black pointer-events-none" />

      <div className="max-w-md w-full bg-gray-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-800 relative z-10 overflow-hidden">

        {/* VERIFYING / JOINING / ACTIVATING / IDLE */}
        {(status === "idle" || status === "verifying" || status === "joining" || status === "activating") && (
          <div className="p-12 text-center space-y-8">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-4 border-gray-800 rounded-full" />
              <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase">
                {statusLabel}
              </h2>
              <p className="text-gray-400 mt-2 text-sm">
                Please don&apos;t close this page.
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
              <p className="text-green-400 mt-2">{successMessage}</p>
              <p className="text-gray-500 text-xs mt-1">
                {redirectLabel}
              </p>
            </div>

            {data?.reference && (
              <div className="text-[10px] text-gray-600 font-mono bg-black/40 p-2 rounded border border-gray-800">
                Ref: {data.reference}
              </div>
            )}
          </div>
        )}

        {/* ERROR */}
        {status === "error" && (
          <div className="p-8 space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-xl font-bold">Verification Failed</h2>
              <p className="text-sm text-red-400 mt-2 bg-red-950/30 p-3 rounded">
                {error}
              </p>
            </div>

            <div className="space-y-3">
              <Button onClick={retry} className="w-full bg-white text-black">
                Try Again
              </Button>

              <Button
                variant="ghost"
                onClick={() => router.replace(dashboardPath)}
                className="w-full text-gray-400"
              >
                Go to Dashboard
              </Button>
            </div>

            {/* Manual Verification */}
            <div className="pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-2 uppercase">
                Manual Verification
              </p>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-black/50 border border-gray-700 rounded px-3 py-2 text-sm"
                  placeholder="Transaction Reference"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!manualId}
                  onClick={() => {
                    const url = new URL(window.location.href)
                    url.searchParams.set("transaction_id", manualId)
                    window.location.href = url.toString()
                  }}
                >
                  Verify
                </Button>
              </div>
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

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        </div>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  )
}