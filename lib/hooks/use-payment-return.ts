import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { apiClient } from "@/lib/api/client"
import type { Tournament } from "@/lib/types"

export type PaymentStatus = "idle" | "verifying" | "joining" | "success" | "error"

interface PaymentReturnState {
    status: PaymentStatus
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
 * Encapsulates the state machine for verify -> join -> redirect flow.
 * Decouples logic from UI to ensure robustness and testability.
 */
export function usePaymentReturn(): UsePaymentReturnResult {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, refreshUser } = useAuthStore()

    const [state, setState] = useState<PaymentReturnState>({
        status: "idle",
        error: null,
        data: null
    })

    const executeVerification = useCallback(async () => {
        // 1. Validate Environment
        const pendingJoin = localStorage.getItem("pending_tournament_join")
        // Retrieve txId from various potential query params
        const txId = searchParams.get("transaction_id") ||
            searchParams.get("tx_ref") ||
            searchParams.get("reference")

        // Case: Missing URL params (User navigated here manually without context)
        if (!txId) {
            // If we have pending data but no ID, they might be cancelling or lost
            setState(prev => ({
                ...prev,
                status: "error",
                error: "No transaction reference found in URL."
            }))
            return
        }

        // Case: Missing Local Storage Context (Session expired or new device)
        if (!pendingJoin) {
            setState(prev => ({
                ...prev,
                status: "error",
                error: "Session expired. We lost track of which tournament you were joining."
            }))
            return
        }

        let tournamentId = ""
        let inviteCode = ""
        try {
            const parsed = JSON.parse(pendingJoin)
            tournamentId = parsed.tournamentId
            inviteCode = parsed.inviteCode
        } catch {
            setState(prev => ({
                ...prev,
                status: "error",
                error: "Invalid session data."
            }))
            return
        }

        // Case: Not Logged In
        if (!user) {
            // We can't join if we don't know who they are. 
            // The UI should handle redirecting to login, but the hook reports the state.
            setState(prev => ({
                ...prev,
                status: "error",
                error: "You must be logged in to complete registration."
            }))
            // Optional: Auto-redirect to login could happen here, but better left to UI/useEffect
            return
        }

        setState(prev => ({ ...prev, status: "verifying", error: null }))

        try {
            // 2. Verify Payment
            console.log(`[PaymentReturn] Verifying tx: ${txId}`)
            const verifyRes = await apiClient.verifyWalletTransaction({ transactionId: txId })

            if (!verifyRes.success) {
                throw new Error(verifyRes.error || "Payment verification failed with the provider.")
            }

            // 3. Join Tournament
            setState(prev => ({ ...prev, status: "joining" }))
            console.log(`[PaymentReturn] Joining tournament: ${tournamentId}`)

            const joinRes = await apiClient.joinTournamentWithCode(inviteCode, user.id)

            if (!joinRes.success) {
                // Special Case: Already joined?
                if (joinRes.error?.toLowerCase().includes("already")) {
                    console.log("[PaymentReturn] User already joined, proceeding as success.")
                } else {
                    throw new Error(joinRes.error || "Payment received, but failed to join tournament.")
                }
            }

            // 4. Cleanup & Success
            localStorage.removeItem("pending_tournament_join")
            try { await refreshUser() } catch { }

            setState({
                status: "success",
                error: null,
                data: {
                    tournamentId,
                    inviteCode,
                    reference: txId
                }
            })

            // 5. Automatic Redirect
            // Small delay to let user see "Success" message
            setTimeout(() => {
                router.replace(`/tournaments/${tournamentId}?joined=true`)
            }, 2000)

        } catch (err: any) {
            console.error("[PaymentReturn] Error:", err)
            setState(prev => ({
                ...prev,
                status: "error",
                error: err.message || "An unexpected error occurred."
            }))
        }
    }, [searchParams, user, refreshUser, router])

    // Initial Trigger
    useEffect(() => {
        if (state.status === "idle" && user) {
            executeVerification()
        }
    }, [state.status, user, executeVerification])

    return {
        ...state,
        retry: () => setState(prev => ({ ...prev, status: "idle", error: null }))
    }
}
