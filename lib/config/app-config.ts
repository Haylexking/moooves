import type { AppConfig } from "@/lib/types"

export const appConfig: AppConfig = {
  minEntryFee: 1000, // ₦1,000
  minPoolSize: 100000, // ₦100,000
  minPlayers: 6,
  maxPlayers: 50,
  matchDuration: 10 * 60, // 10 minutes in seconds
  hostUnlockGames: 2,
  payoutSplit: {
    host: 0.5, // 50%
    winners: {
      first: 0.2, // 20%
      second: 0.12, // 12%
      third: 0.08, // 8%
    },
    platform: 0.1, // 10%
  },
  paymentGateways: {
    flutterwave: {
      publicKey: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || "",
      secretKey: process.env.FLUTTERWAVE_SECRET_KEY || "",
    },
    paystack: {
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
      secretKey: process.env.PAYSTACK_SECRET_KEY || "",
    },
  },
}
