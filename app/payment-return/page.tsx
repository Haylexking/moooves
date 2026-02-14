"use strict";
"use client"

import { usePaymentReturn } from "@/lib/hooks/use-payment-return"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

function PaymentReturnContent() {
    const { status, error, data, retry } = usePaymentReturn()
    const { user, isLoading: authLoading, rehydrated } = useAuthStore()
    const router = useRouter()
    const [manualId, setManualId] = useState("")

    // Handle Auth Redirects
    useEffect(() => {
        // Only redirect if we are done loading AND rehydrated, and still no user
        if (!authLoading && rehydrated && !user) {
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
            router.replace(`/login?redirect=${returnUrl}`)
        }
    }, [authLoading, rehydrated, user, router])

    if (authLoading || !rehydrated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <div className="text-center space-y-4 animate-pulse">
                    <Loader2 className="w-10 h-10 text-green-500 mx-auto animate-spin" />
                    <h1 className="text-xl font-bold text-white">Session Expired</h1>
                    <p className="text-gray-400 text-sm">Redirecting you to login to complete verification...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black relative overflow-hidden font-sans text-white flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black pointer-events-none" />

            <div className="max-w-md w-full bg-gray-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-800 relative z-10 overflow-hidden">

                {/* STATUS: VERIFYING / JOINING */}
                {(status === "verifying" || status === "joining") && (
                    <div className="p-12 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                        <div className="relative w-24 h-24 mx-auto">
                            <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-wide">
                                {status === "verifying" ? "Verifying..." : "Joining..."}
                            </h2>
                            <p className="text-gray-400 mt-2 text-sm">
                                Securing your spot in the tournament.
                            </p>
                        </div>
                    </div>
                )}

                {/* STATUS: SUCCESS */}
                {status === "success" && (
                    <div className="p-12 text-center space-y-8 animate-in fade-in zoom-in-90 duration-500">
                        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto ring-1 ring-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                            <CheckCircle className="w-12 h-12 text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">You're In!</h2>
                            <p className="text-green-400/80 mt-2 font-medium">
                                Payment Confirmed.
                            </p>
                            <p className="text-gray-500 text-xs mt-1">Redirecting to lobby...</p>
                        </div>
                        {data?.reference && (
                            <div className="text-[10px] text-gray-600 font-mono bg-black/40 p-2 rounded border border-gray-800">
                                Ref: {data.reference}
                            </div>
                        )}
                    </div>
                )}

                {/* STATUS: ERROR */}
                {status === "error" && (
                    <div className="p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                                <XCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Verification Failed</h2>
                            <p className="text-sm text-red-400 mt-2 bg-red-950/30 p-3 rounded-xl border border-red-900/50">
                                {error}
                            </p>
                        </div>

                        <div className="space-y-3 pt-4">
                            <Button onClick={retry} className="w-full bg-white text-black hover:bg-gray-200 font-bold">
                                Try Again
                            </Button>
                            <Button
                                onClick={() => router.push("/dashboard")}
                                variant="ghost"
                                className="w-full text-gray-500 hover:text-white"
                            >
                                Return to Dashboard
                            </Button>
                        </div>

                        {/* Manual Override */}
                        {error?.includes("verification") && (
                            <div className="mt-6 pt-6 border-t border-gray-800/50">
                                <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Manual Verification</p>
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 text-sm bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-green-500 outline-none transition-colors"
                                        placeholder="Transaction Reference"
                                        value={manualId}
                                        onChange={(e) => setManualId(e.target.value)}
                                    />
                                    <Button
                                        variant="outline" // Changed to outline for better contrast
                                        size="sm"
                                        className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800"
                                        onClick={() => {
                                            const url = new URL(window.location.href)
                                            url.searchParams.set("transaction_id", manualId)
                                            window.location.href = url.toString()
                                        }}
                                        disabled={!manualId}
                                    >
                                        Verify
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <p className="absolute bottom-8 text-[10px] text-gray-600 uppercase tracking-widest">
                Secured by Moooves
            </p>
        </div>
    )
}

export default function PaymentReturnPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
        }>
            <PaymentReturnContent />
        </Suspense>
    )
}
