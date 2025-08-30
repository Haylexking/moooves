"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { GameButton } from "@/components/ui/game-button"

export default function VerificationPage() {
  // State for code, refs, loading, and error
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputs = useRef<Array<HTMLInputElement | null>>(Array.from({ length: 6 }, () => null))
  const router = useRouter()

  // Handler for input change
  function handleInput(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    const val = e.target.value.replace(/[^0-9a-zA-Z]/g, "").slice(0, 1)
    const newCode = [...code]
    newCode[idx] = val
    setCode(newCode)
    if (val && idx < 5) {
      inputs.current[idx + 1]?.focus()
    } else if (!val && idx > 0) {
      inputs.current[idx - 1]?.focus()
    }
  }

  // Handler for backspace
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, idx: number) {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus()
    }
  }

  // Handler for paste
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^0-9a-zA-Z]/g, "")
      .slice(0, 6)
    if (pasted.length === 6) {
      setCode(pasted.split(""))
      setTimeout(() => inputs.current[5]?.focus(), 0)
    }
    e.preventDefault()
  }

  // DEVELOPMENT MODE: Skip real verification, just go to dashboard
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Simulate network delay for realistic feel
      await new Promise((res) => setTimeout(res, 1000))

      // In development mode, any 6-digit code works
      if (code.join("").length === 6) {
        console.log("✅ Development Mode: Verification bypassed, going to dashboard")
        router.push("/dashboard")
      } else {
        throw new Error("Please enter a 6-digit code")
      }
    } catch (err: any) {
      setError(err.message || "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-black overflow-hidden">
      {/* Background image */}
      <Image
        src="/images/background.png"
        alt="Background"
        fill
        className="object-cover object-center z-0 opacity-90"
        priority
      />
      {/* Centered verification card */}
      <div className="relative z-10 w-full max-w-md mx-auto mt-12 rounded-[24px] bg-[#E6FFE6]/90 border-4 border-[#6AC56E] shadow-2xl flex flex-col items-center px-6 py-8">
        {/* XO logo */}
        <div className="-mt-16 mb-2 flex justify-center w-full">
          <Image src="/images/XO.png" alt="XO Logo" width={120} height={60} className="drop-shadow-xl" />
        </div>
        <div className="mb-6 text-center w-full">
          <span className="text-[#002B03] text-xl font-bold">Please enter code sent to your email</span>
          {/* Development Mode Indicator */}
          <div className="mt-2 text-xs text-green-700 bg-green-200 px-2 py-1 rounded">
            🚧 DEV MODE: Any 6-digit code works
          </div>
        </div>
        <form className="flex flex-col items-center w-full gap-6" onSubmit={handleSubmit}>
          <div className="flex gap-3 justify-center w-full mb-2">
            {Array.from({ length: 6 }, (_, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputs.current[idx] = el
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={code[idx]}
                className="w-14 h-14 rounded-lg bg-[#D6F5D6] border border-[#BFC4BF] text-3xl text-center font-extrabold text-[#002B03] focus:outline-none focus:ring-2 focus:ring-[#6AC56E] shadow-sm"
                onChange={(e) => handleInput(e, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                onPaste={handlePaste}
                autoFocus={idx === 0}
              />
            ))}
          </div>
          {error && <div className="text-red-600 text-sm font-semibold mb-2 text-center w-full">{error}</div>}
          <GameButton type="submit" className="w-40 mx-auto" disabled={code.some((c) => !c) || loading}>
            {loading ? "Verifying..." : "Submit"}
          </GameButton>
        </form>

        {/* Back to Login */}
        <div className="mt-4 text-center w-full">
          <button onClick={() => router.push("/onboarding")} className="text-[#002B03] text-sm hover:underline">
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
