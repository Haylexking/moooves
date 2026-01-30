"use strict";
"use client"

import { usePaymentReturn } from "@/lib/hooks/use-payment-return"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

function PaymentReturnContent() {
    const { status, error, data, retry } = usePaymentReturn()
    const { user, isLoading: authLoading } = useAuthStore()
    const router = useRouter()

    // Local fallback state for "Manual Entry" if auto-verify fails hard
    const [manualId, setManualId] = useState("")

    // Handle Auth Redirects
    useEffect(() => {
        // If auth finishes loading and no user found, redirect to login
        if (!authLoading && !user) {
            // Save current URL to return after login
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
            router.replace(`/login?redirect=${returnUrl}`)
        }
    }, [authLoading, user, router])

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
        )
    }

    // If we ended up here but not logged in, show a friendly message (useEffect above will redirect, but just in case)
    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-yellow-200">
                    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h1>
                    <p className="text-gray-600 mb-6">
                        We verified your payment session, but we need you to log in to finish the registration.
                    </p>
                    <Button onClick={() => window.location.reload()} className="w-full">
                        Refresh Page
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300">

                {/* STATUS: VERIFYING / JOINING */}
                {(status === "verifying" || status === "joining") && (
                    <div className="p-12 text-center space-y-6">
                        <div className="relative w-20 h-20 mx-auto">
                            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {status === "verifying" ? "Verifying Payment..." : "Securing Your Spot..."}
                            </h2>
                            <p className="text-gray-500 mt-2">
                                Please wait while we confirm your transaction and register you for the tournament.
                            </p>
                        </div>
                    </div>
                )}

                {/* STATUS: SUCCESS */}
                {status === "success" && (
                    <div className="p-12 text-center space-y-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-300">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">You're In!</h2>
                            <p className="text-gray-600 mt-2">
                                Registration successful. Redirecting you to the lobby...
                            </p>
                        </div>
                        <div className="text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded">
                            Ref: {data?.reference}
                        </div>
                    </div>
                )}

                {/* STATUS: ERROR */}
                {status === "error" && (
                    <div className="p-8 space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <XCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Verification Failed</h2>
                            <p className="text-sm text-red-600 mt-2 bg-red-50 p-3 rounded-lg border border-red-100">
                                {error}
                            </p>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-gray-100">
                            <Button onClick={retry} variant="default" className="w-full">
                                Try Again
                            </Button>
                            <Button
                                onClick={() => router.push("/dashboard")}
                                variant="ghost"
                                className="w-full text-gray-500"
                            >
                                Return to Dashboard
                            </Button>
                        </div>

                        {/* Manual Override (Only show if it's a verification/API error, not session error) */}
                        {error?.includes("verification") && (
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <p className="text-xs text-gray-500 mb-2 font-medium">Manual Backup</p>
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 text-sm border rounded px-3 py-2"
                                        placeholder="Transaction Reference"
                                        value={manualId}
                                        onChange={(e) => setManualId(e.target.value)}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            // Force a retry with new params by reloading with query param
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

            <p className="mt-8 text-xs text-gray-400">
                Secure Payment Verification by Moooves
            </p>
        </div>
    )
}

export default function PaymentReturnPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
        }>
            <PaymentReturnContent />
        </Suspense>
    )
}
