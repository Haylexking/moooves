import type { StateCreator } from "zustand"
import type { Payment, Payout, InitiatePaymentRequest } from "@/lib/types"

export interface PaymentSlice {
  payments: Payment[]
  payouts: Payout[]
  currentPayment: Payment | null
  isProcessing: boolean

  // Actions
  initiatePayment: (request: InitiatePaymentRequest) => Promise<string>
  confirmPayment: (paymentId: string) => Promise<void>
  loadUserPayments: (userId: string) => Promise<void>
  processPayout: (tournamentId: string) => Promise<void>
}

export const createPaymentSlice: StateCreator<PaymentSlice> = (set, get) => ({
  payments: [],
  payouts: [],
  currentPayment: null,
  isProcessing: false,

  initiatePayment: async (request: InitiatePaymentRequest) => {
    set({ isProcessing: true })
    try {
      // TODO: Replace with actual payment gateway integration
      const payment: Payment = {
        id: `payment-${Date.now()}`,
        userId: "current-user-id", // Get from auth
        tournamentId: request.tournamentId,
        amount: request.amount,
        currency: "NGN",
        method: request.method,
        status: "pending",
        gatewayReference: `ref-${Date.now()}`,
        createdAt: Date.now(),
      }

      set((state) => ({
        payments: [...state.payments, payment],
        currentPayment: payment,
        isProcessing: false,
      }))

      return payment.id
    } catch (error) {
      set({ isProcessing: false })
      throw error
    }
  },

  confirmPayment: async (paymentId: string) => {
    try {
      // TODO: Replace with actual API call
      set((state) => ({
        payments: state.payments.map((p) =>
          p.id === paymentId ? { ...p, status: "confirmed" as const, confirmedAt: Date.now() } : p,
        ),
      }))
    } catch (error) {
      throw error
    }
  },

  loadUserPayments: async (userId: string) => {
    try {
      // TODO: Replace with actual API call
      const userPayments: Payment[] = []
      set({ payments: userPayments })
    } catch (error) {
      throw error
    }
  },

  processPayout: async (tournamentId: string) => {
    set({ isProcessing: true })
    try {
      // TODO: Replace with actual payout logic
      // 1. Calculate splits (50% host, 40% winners, 10% platform)
      // 2. Create payout records
      // 3. Process payments via gateway
      // 4. Trigger social share prompt for host

      set({ isProcessing: false })
    } catch (error) {
      set({ isProcessing: false })
      throw error
    }
  },
})
