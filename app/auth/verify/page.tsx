"use client"
import Image from "next/image"
import { useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { GameButton } from "@/components/ui/game-button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

export default function VerifyEmailPage() {
  const { verifyAccountOtp, error, clearError, isLoading, user } = useAuthStore()
  const [email, setEmail] = useState<string>(user?.email || "")
  const [otp, setOtp] = useState<string>("")
  const [localError, setLocalError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    if (!email) {
      setLocalError("Email is required")
      return
    }
    if (!otp || otp.length < 4) {
      setLocalError("Enter the verification code sent to your email")
      return
    }
    try {
      await verifyAccountOtp(email.trim(), otp.trim())
      // Success path will redirect via store (honors return_to), so no-op here
    } catch (err: any) {
      setLocalError(err?.message || "Verification failed")
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-black overflow-hidden">
      <Image
        src="/images/background.png"
        alt="Background"
        fill
        className="object-cover object-center z-0 opacity-90"
        priority
      />
      <div className="relative z-10 w-full max-w-md mx-auto rounded-[24px] bg-[#E6FFE6]/90 border-4 border-[#6AC56E] shadow-2xl flex flex-col items-center px-6 py-8">
        <div className="-mt-16 mb-4 flex justify-center w-full">
          <Image src="/images/XO.png" alt="XO Logo" width={120} height={60} className="drop-shadow-xl" />
        </div>
        <h2 className="text-xl font-bold text-[#002B03] mb-6 text-center">Verify your email</h2>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full">
          <label className="text-[#002B03] font-bold">Email</label>
          <div className="relative">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pr-3 py-2 px-3 rounded-lg bg-[#E6FFE6] border border-[#BFC4BF] text-[#002B03] font-semibold focus:outline-none focus:ring-2 focus:ring-[#6AC56E]"
              required
            />
          </div>

          <label className="text-[#002B03] font-bold">Verification code</label>
          <div className="flex items-center justify-center">
            <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
              <InputOTPGroup>
                <InputOTPSlot index={0} className="border-gray-400" />
                <InputOTPSlot index={1} className="border-gray-400" />
                <InputOTPSlot index={2} className="border-gray-400" />
                <InputOTPSlot index={3} className="border-gray-400" />
                <InputOTPSlot index={4} className="border-gray-400" />
                <InputOTPSlot index={5} className="border-gray-400" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {(localError || error) && (
            <div role="alert" className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {localError || error}
              {error && (
                <button type="button" className="ml-2 underline text-xs" onClick={clearError}>Dismiss</button>
              )}
            </div>
          )}

          <GameButton type="submit" className="mt-2" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify Email"}
          </GameButton>
        </form>
      </div>
    </div>
  )
}
