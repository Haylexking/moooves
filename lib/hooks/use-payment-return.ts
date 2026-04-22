import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useTournamentStore } from "@/lib/stores/tournament-store"
import { apiClient } from "@/lib/api/client"

export type PaymentStatus = "idle" | "verifying" | "joining" | "activating" | "success" | "error"
export type PaymentFlow = "player" | "host" | "unknown"

interface PaymentReturnState {
    status: PaymentStatus
    flow: PaymentFlow
    error: string | null
    data: {
        tournamentId: string
        inviteCode: string
        reference: string
    } | null
}

interface UsePaymentReturnResult extends PaymentReturnState {
    retry: () => void
}

/**
 * usePaymentReturn Hook
 *
 * Unified payment verification for BOTH player entry-fee payments
 * and host activation-fee payments.
 *
 * Flow detection:
 *  - localStorage "pending_host_payment"   → Host flow  (verify → activate → redirect)
 *  - localStorage "pending_tournament_join" → Player flow (verify → join → redirect)
 *  - Neither present                       → Best-effort verify-only fallback
 */
export function usePaymentReturn(): UsePaymentReturnResult {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, refreshUser, isLoading: isAuthLoading } = useAuthStore()
    const { loadAllTournaments } = useTournamentStore()

    const [state, setState] = useState<PaymentReturnState>({
        status: "idle",
        flow: "unknown",
        error: null,
        data: null,
    })

    const executeVerification = useCallback(async () => {
        // ── 1. Auth gate ─────────────────────────────────────────────
        if (!user) {
            setState(prev => ({
                ...prev,
                status: "error",
                error: "You must be logged in to complete verification. Please log in and try again.",
            }))
            return
        }

        // ── 2. Transaction reference from URL ────────────────────────
        const txId =
            searchParams.get("transaction_id") ||
            searchParams.get("tx_ref") ||
            searchParams.get("reference")

        if (!txId) {
            setState(prev => ({
                ...prev,
                status: "error",
                error: "No transaction reference found in URL.",
            }))
            return
        }

        // ── 3. Detect flow from localStorage ─────────────────────────
        const pendingHost = localStorage.getItem("pending_host_payment")
        const pendingPlayer = localStorage.getItem("pending_tournament_join")

        let flow: PaymentFlow = "unknown"
        let tournamentId = ""
        let inviteCode = ""

        if (pendingHost) {
            flow = "host"
            try {
                const parsed = JSON.parse(pendingHost)
                tournamentId = parsed.tournamentId || ""
            } catch {
                // Corrupted data — fall through to unknown flow
                flow = "unknown"
            }
        } else if (pendingPlayer) {
            flow = "player"
            try {
                const parsed = JSON.parse(pendingPlayer)
                tournamentId = parsed.tournamentId || ""
                inviteCode = parsed.inviteCode || ""
            } catch {
                setState(prev => ({
                    ...prev,
                    status: "error",
                    error: "Invalid session data.",
                }))
                return
            }
        } else {
            // No localStorage context — best-effort: check user role
            flow = user?.role === "host" ? "host" : "unknown"
            // Try to get tournamentId from URL
            tournamentId = searchParams.get("tournamentId") || ""
        }

        setState(prev => ({ ...prev, flow, status: "verifying", error: null }))

        try {
            // ── 4. Verify payment with backend ───────────────────────
            // Pass tournamentId to link host activation if applicable
            const verifyRes = await apiClient.verifyWalletTransaction({ 
                transactionId: txId, 
                tournamentId: tournamentId || undefined 
            })
            if (!verifyRes.success) {
                throw new Error(verifyRes.error || "Payment verification failed.")
            }

            // ── 5. Flow-specific post-verification ───────────────────
            if (flow === "player" && inviteCode) {
                // Player flow: verify ✓ → join tournament → redirect to lobby
                setState(prev => ({ ...prev, status: "joining" }))

                const joinRes = await apiClient.joinTournamentWithCode(inviteCode, user.id)
                if (!joinRes.success) {
                    // Allow "already joined" as success
                    if (!joinRes.error?.toLowerCase().includes("already")) {
                        throw new Error(joinRes.error || "Payment received, but failed to join tournament.")
                    }
                }

                localStorage.removeItem("pending_tournament_join")
                try { await refreshUser() } catch { }

                setState({
                    status: "success",
                    flow,
                    error: null,
                    data: { tournamentId, inviteCode, reference: txId },
                })

                setTimeout(() => {
                    router.replace(`/tournaments/${tournamentId}?joined=true`)
                }, 2000)

            } else if (flow === "host") {
                // Host flow: verify ✓ → tournament activated by backend → redirect
                setState(prev => ({ ...prev, status: "activating" }))

                localStorage.removeItem("pending_host_payment")
                try { 
                    await refreshUser() 
                    await loadAllTournaments()
                } catch (e) {
                    console.error("Post-verification refresh failed:", e)
                }

                setState({
                    status: "success",
                    flow,
                    error: null,
                    data: { tournamentId, inviteCode: "", reference: txId },
                })

                setTimeout(() => {
                    if (tournamentId) {
                        router.replace(`/tournaments/${tournamentId}`)
                    } else {
                        router.replace("/host-dashboard")
                    }
                }, 2000)

            } else {
                // Unknown flow — just show success and redirect to dashboard
                setState({
                    status: "success",
                    flow,
                    error: null,
                    data: { tournamentId, inviteCode: "", reference: txId },
                })

                const urlTournamentId = searchParams.get("tournamentId")
                const isHost = user?.role === "host"
                setTimeout(() => {
                    if (urlTournamentId) {
                        router.replace(`/tournaments/${urlTournamentId}`)
                    } else if (isHost) {
                        router.replace("/host-dashboard")
                    } else {
                        router.replace("/dashboard")
                    }
                }, 2000)
            }

        } catch (err: any) {
            setState(prev => ({
                ...prev,
                status: "error",
                error: err.message || "An unexpected error occurred.",
            }))
        }
    }, [searchParams, user, refreshUser, router])

    // Initial Trigger
    useEffect(() => {
        if (state.status === "idle" && !isAuthLoading) {
            executeVerification()
        }
    }, [state.status, isAuthLoading, executeVerification])

    return {
        ...state,
        retry: () => setState({ status: "idle", flow: "unknown", error: null, data: null }),
    }
}
